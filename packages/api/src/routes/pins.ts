import { db } from "@ithaka/db";
import { photos, pinWishes, pins, tripTravelers, trips, user } from "@ithaka/db/schema";
import {
  canContribute,
  canDeleteOthersContent,
  convertPinSchema,
  createPinSchema,
  updatePinSchema,
} from "@ithaka/shared";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../context";
import { requireMembership } from "../context";
import { id } from "../ids";
import { publicPhotoUrl } from "../storage";

async function pinPayload(pinId: string) {
  const pin = await db.query.pins.findFirst({ where: eq(pins.id, pinId) });
  if (!pin) throw new HTTPException(404, { message: "Pin not found" });

  const wishes = await db
    .select({ userId: user.id, name: user.name, image: user.image })
    .from(pinWishes)
    .innerJoin(user, eq(pinWishes.userId, user.id))
    .where(eq(pinWishes.pinId, pinId));

  const tripRows = await db.select().from(trips).where(eq(trips.pinId, pinId)).orderBy(desc(trips.createdAt));
  const tripIds = tripRows.map((t) => t.id);

  const travelerRows =
    tripIds.length === 0
      ? []
      : await db
          .select({
            tripId: tripTravelers.tripId,
            userId: user.id,
            name: user.name,
            image: user.image,
          })
          .from(tripTravelers)
          .innerJoin(user, eq(tripTravelers.userId, user.id))
          .where(inArray(tripTravelers.tripId, tripIds));

  const photoRows =
    tripIds.length === 0
      ? []
      : await db.select().from(photos).where(inArray(photos.tripId, tripIds));

  const mappedTrips = tripRows.map((trip) => ({
    ...trip,
    travelers: travelerRows.filter((t) => t.tripId === trip.id),
    photos: photoRows
      .filter((p) => p.tripId === trip.id)
      .map((photo) => ({ ...photo, url: publicPhotoUrl(photo.storageKey) })),
    coverUrl: photoRows.find((p) => p.id === trip.coverPhotoId || p.tripId === trip.id)?.storageKey
      ? publicPhotoUrl(
          photoRows.find((p) => p.id === trip.coverPhotoId)?.storageKey ??
            photoRows.find((p) => p.tripId === trip.id)!.storageKey,
        )
      : null,
  }));

  return { ...pin, wishes, trips: mappedTrips, coverUrl: mappedTrips[0]?.coverUrl ?? null };
}

export const pinRoutes = new Hono<AppEnv>()
  .get("/circles/:circleId/pins", async (c) => {
    const me = c.get("user");
    const circleId = c.req.param("circleId");
    await requireMembership(me.id, circleId);
    const status = c.req.query("status");
    const mine = c.req.query("mine") === "true";

    const rows = await db.select().from(pins).where(eq(pins.circleId, circleId));
    const filtered = rows.filter((pin) => {
      if (status && status !== "all" && pin.status !== status) return false;
      if (mine && pin.createdBy !== me.id) return false;
      return true;
    });

    const pinIds = filtered.map((p) => p.id);
    const tripRows =
      pinIds.length === 0
        ? []
        : await db.select().from(trips).where(inArray(trips.pinId, pinIds)).orderBy(desc(trips.createdAt));
    const coverIds = tripRows.map((t) => t.coverPhotoId).filter((value): value is string => Boolean(value));
    const coverPhotos =
      coverIds.length === 0 ? [] : await db.select().from(photos).where(inArray(photos.id, coverIds));
    const firstPhotos =
      tripRows.length === 0
        ? []
        : await db.select().from(photos).where(inArray(photos.tripId, tripRows.map((t) => t.id)));

    const list = filtered.map((pin) => {
      const latestTrip = tripRows.find((t) => t.pinId === pin.id);
      const cover =
        coverPhotos.find((p) => p.id === latestTrip?.coverPhotoId) ??
        firstPhotos.find((p) => p.tripId === latestTrip?.id);
      return {
        ...pin,
        coverUrl: cover ? publicPhotoUrl(cover.storageKey) : null,
      };
    });

    return c.json({ pins: list });
  })
  .post("/circles/:circleId/pins", async (c) => {
    const me = c.get("user");
    const circleId = c.req.param("circleId");
    const membership = await requireMembership(me.id, circleId);
    if (!canContribute(membership.role)) {
      throw new HTTPException(403, { message: "You cannot add pins in this circle" });
    }
    const body = createPinSchema.parse(await c.req.json());
    const pinId = id("pin");
    await db.insert(pins).values({
      id: pinId,
      circleId,
      lat: body.lat,
      lng: body.lng,
      placeName: body.placeName,
      countryCode: body.countryCode,
      status: body.status,
      note: body.note,
      createdBy: me.id,
    });
    if (body.status === "wishlist") {
      await db.insert(pinWishes).values({ id: id("wish"), pinId, userId: me.id });
    }
    if (body.status === "visited") {
      await db.insert(trips).values({
        id: id("trip"),
        pinId,
        note: body.note,
        createdBy: me.id,
      });
    }
    return c.json({ pin: await pinPayload(pinId) }, 201);
  })
  .get("/pins/:pinId", async (c) => {
    const me = c.get("user");
    const pinId = c.req.param("pinId");
    const pin = await db.query.pins.findFirst({ where: eq(pins.id, pinId) });
    if (!pin) throw new HTTPException(404, { message: "Pin not found" });
    await requireMembership(me.id, pin.circleId);
    return c.json({ pin: await pinPayload(pinId) });
  })
  .patch("/pins/:pinId", async (c) => {
    const me = c.get("user");
    const pinId = c.req.param("pinId");
    const pin = await db.query.pins.findFirst({ where: eq(pins.id, pinId) });
    if (!pin) throw new HTTPException(404, { message: "Pin not found" });
    const membership = await requireMembership(me.id, pin.circleId);
    if (!canContribute(membership.role)) {
      throw new HTTPException(403, { message: "You cannot edit pins in this circle" });
    }
    const body = updatePinSchema.parse(await c.req.json());
    await db
      .update(pins)
      .set({
        placeName: body.placeName ?? pin.placeName,
        status: body.status ?? pin.status,
        note: body.note === undefined ? pin.note : body.note,
        countryCode: body.countryCode === undefined ? pin.countryCode : body.countryCode,
        updatedAt: new Date(),
      })
      .where(eq(pins.id, pinId));
    return c.json({ pin: await pinPayload(pinId) });
  })
  .delete("/pins/:pinId", async (c) => {
    const me = c.get("user");
    const pinId = c.req.param("pinId");
    const pin = await db.query.pins.findFirst({ where: eq(pins.id, pinId) });
    if (!pin) throw new HTTPException(404, { message: "Pin not found" });
    const membership = await requireMembership(me.id, pin.circleId);
    if (pin.createdBy !== me.id && !canDeleteOthersContent(membership.role)) {
      throw new HTTPException(403, { message: "You cannot remove this pin" });
    }
    await db.delete(pins).where(eq(pins.id, pinId));
    return c.json({ ok: true });
  })
  .post("/pins/:pinId/wish", async (c) => {
    const me = c.get("user");
    const pinId = c.req.param("pinId");
    const pin = await db.query.pins.findFirst({ where: eq(pins.id, pinId) });
    if (!pin) throw new HTTPException(404, { message: "Pin not found" });
    await requireMembership(me.id, pin.circleId);
    const existing = await db.query.pinWishes.findFirst({
      where: and(eq(pinWishes.pinId, pinId), eq(pinWishes.userId, me.id)),
    });
    if (existing) {
      await db.delete(pinWishes).where(eq(pinWishes.id, existing.id));
    } else {
      await db.insert(pinWishes).values({ id: id("wish"), pinId, userId: me.id });
    }
    return c.json({ pin: await pinPayload(pinId) });
  })
  .post("/pins/:pinId/visit", async (c) => {
    const me = c.get("user");
    const pinId = c.req.param("pinId");
    const pin = await db.query.pins.findFirst({ where: eq(pins.id, pinId) });
    if (!pin) throw new HTTPException(404, { message: "Pin not found" });
    const membership = await requireMembership(me.id, pin.circleId);
    if (!canContribute(membership.role)) {
      throw new HTTPException(403, { message: "You cannot convert this pin" });
    }
    const body = convertPinSchema.parse(await c.req.json().catch(() => ({})));
    await db.update(pins).set({ status: "visited", updatedAt: new Date() }).where(eq(pins.id, pinId));
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
    await db.insert(tripTravelers).values(
      travelers.map((userId) => ({ id: id("trav"), tripId, userId })),
    );
    return c.json({ pin: await pinPayload(pinId) });
  });
