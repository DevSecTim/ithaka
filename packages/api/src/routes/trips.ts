import { db } from "@ithaka/db";
import { photos, pins, tripTravelers, trips, user } from "@ithaka/db/schema";
import { canContribute, createTripSchema, updateTripSchema } from "@ithaka/shared";
import { desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../context";
import { requireMembership } from "../context";
import { id } from "../ids";
import { publicPhotoUrl } from "../storage";

async function tripPayload(tripId: string) {
  const trip = await db.query.trips.findFirst({ where: eq(trips.id, tripId) });
  if (!trip) throw new HTTPException(404, { message: "Trip not found" });
  const pin = await db.query.pins.findFirst({ where: eq(pins.id, trip.pinId) });
  const travelers = await db
    .select({ userId: user.id, name: user.name, image: user.image })
    .from(tripTravelers)
    .innerJoin(user, eq(tripTravelers.userId, user.id))
    .where(eq(tripTravelers.tripId, tripId));
  const album = await db.select().from(photos).where(eq(photos.tripId, tripId));
  return {
    ...trip,
    pin,
    travelers,
    photos: album.map((photo) => ({ ...photo, url: publicPhotoUrl(photo.storageKey) })),
    coverUrl: album.find((p) => p.id === trip.coverPhotoId)?.storageKey
      ? publicPhotoUrl(album.find((p) => p.id === trip.coverPhotoId)!.storageKey)
      : album[0]
        ? publicPhotoUrl(album[0].storageKey)
        : null,
  };
}

export const tripRoutes = new Hono<AppEnv>()
  .get("/circles/:circleId/scrapbook", async (c) => {
    const me = c.get("user");
    const circleId = c.req.param("circleId");
    await requireMembership(me.id, circleId);
    const circlePins = await db.select().from(pins).where(eq(pins.circleId, circleId));
    const pinIds = circlePins.map((p) => p.id);
    if (pinIds.length === 0) return c.json({ trips: [] });
    const tripRows = await db.select().from(trips).where(inArray(trips.pinId, pinIds)).orderBy(desc(trips.createdAt));
    const payloads = await Promise.all(tripRows.map((t) => tripPayload(t.id)));
    return c.json({ trips: payloads });
  })
  .post("/pins/:pinId/trips", async (c) => {
    const me = c.get("user");
    const pinId = c.req.param("pinId");
    const pin = await db.query.pins.findFirst({ where: eq(pins.id, pinId) });
    if (!pin) throw new HTTPException(404, { message: "Pin not found" });
    const membership = await requireMembership(me.id, pin.circleId);
    if (!canContribute(membership.role)) {
      throw new HTTPException(403, { message: "You cannot add trips in this circle" });
    }
    const body = createTripSchema.parse(await c.req.json().catch(() => ({})));
    const tripId = id("trip");
    await db.insert(trips).values({
      id: tripId,
      pinId,
      startDate: body.startDate,
      endDate: body.endDate,
      note: body.note,
      createdBy: me.id,
    });
    const travelers = body.travelerIds?.length ? body.travelerIds : [me.id];
    await db.insert(tripTravelers).values(travelers.map((userId) => ({ id: id("trav"), tripId, userId })));
    if (pin.status !== "visited") {
      await db.update(pins).set({ status: "visited", updatedAt: new Date() }).where(eq(pins.id, pinId));
    }
    return c.json({ trip: await tripPayload(tripId) }, 201);
  })
  .get("/trips/:tripId", async (c) => {
    const me = c.get("user");
    const tripId = c.req.param("tripId");
    const trip = await db.query.trips.findFirst({ where: eq(trips.id, tripId) });
    if (!trip) throw new HTTPException(404, { message: "Trip not found" });
    const pin = await db.query.pins.findFirst({ where: eq(pins.id, trip.pinId) });
    if (!pin) throw new HTTPException(404, { message: "Pin not found" });
    await requireMembership(me.id, pin.circleId);
    return c.json({ trip: await tripPayload(tripId) });
  })
  .patch("/trips/:tripId", async (c) => {
    const me = c.get("user");
    const tripId = c.req.param("tripId");
    const trip = await db.query.trips.findFirst({ where: eq(trips.id, tripId) });
    if (!trip) throw new HTTPException(404, { message: "Trip not found" });
    const pin = await db.query.pins.findFirst({ where: eq(pins.id, trip.pinId) });
    if (!pin) throw new HTTPException(404, { message: "Pin not found" });
    const membership = await requireMembership(me.id, pin.circleId);
    if (!canContribute(membership.role)) {
      throw new HTTPException(403, { message: "You cannot edit this scrapbook" });
    }
    const body = updateTripSchema.parse(await c.req.json());
    await db
      .update(trips)
      .set({
        startDate: body.startDate === undefined ? trip.startDate : body.startDate,
        endDate: body.endDate === undefined ? trip.endDate : body.endDate,
        note: body.note === undefined ? trip.note : body.note,
        coverPhotoId: body.coverPhotoId === undefined ? trip.coverPhotoId : body.coverPhotoId,
        updatedAt: new Date(),
      })
      .where(eq(trips.id, tripId));
    if (body.travelerIds) {
      await db.delete(tripTravelers).where(eq(tripTravelers.tripId, tripId));
      if (body.travelerIds.length) {
        await db.insert(tripTravelers).values(
          body.travelerIds.map((userId) => ({ id: id("trav"), tripId, userId })),
        );
      }
    }
    return c.json({ trip: await tripPayload(tripId) });
  });
