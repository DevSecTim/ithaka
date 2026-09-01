import { db } from "@ithaka/db";
import { photos, pins, trips } from "@ithaka/db/schema";
import { MAX_PHOTOS_PER_TRIP, canContribute, createPhotoSchema } from "@ithaka/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Readable } from "node:stream";
import type { AppEnv } from "../context";
import { requireMembership } from "../context";
import { id } from "../ids";
import { createUploadTarget, getObjectStream, publicPhotoUrl, putLocalObject } from "../storage";

export const photoRoutes = new Hono<AppEnv>()
  .post("/photos/sign", async (c) => {
    const me = c.get("user");
    const body = await c.req.json<{ tripId: string; contentType?: string }>();
    const trip = await db.query.trips.findFirst({ where: eq(trips.id, body.tripId) });
    if (!trip) throw new HTTPException(404, { message: "Trip not found" });
    const pin = await db.query.pins.findFirst({ where: eq(pins.id, trip.pinId) });
    if (!pin) throw new HTTPException(404, { message: "Pin not found" });
    const membership = await requireMembership(me.id, pin.circleId);
    if (!canContribute(membership.role)) {
      throw new HTTPException(403, { message: "You cannot add photos here" });
    }
    const existing = await db.select().from(photos).where(eq(photos.tripId, trip.id));
    if (existing.length >= MAX_PHOTOS_PER_TRIP) {
      throw new HTTPException(400, { message: `This scrapbook page holds ${MAX_PHOTOS_PER_TRIP} photos` });
    }
    const ext = (body.contentType ?? "image/jpeg").split("/")[1] ?? "jpg";
    const storageKey = `${pin.circleId}/${trip.id}/${id("pho")}.${ext}`;
    const target = await createUploadTarget(storageKey, body.contentType ?? "image/jpeg");
    return c.json(target);
  })
  .put("/photos/upload", async (c) => {
    const me = c.get("user");
    const key = c.req.query("key");
    if (!key) throw new HTTPException(400, { message: "Missing key" });
    const circleId = key.split("/")[0];
    if (!circleId) throw new HTTPException(400, { message: "Invalid key" });
    await requireMembership(me.id, circleId);
    const buffer = Buffer.from(await c.req.arrayBuffer());
    if (buffer.byteLength > 8 * 1024 * 1024) {
      throw new HTTPException(400, { message: "Photos must be under 8MB" });
    }
    await putLocalObject(key, buffer, c.req.header("content-type") ?? "image/jpeg");
    return c.json({ storageKey: key });
  })
  .post("/photos", async (c) => {
    const me = c.get("user");
    const body = createPhotoSchema.parse(await c.req.json());
    const trip = await db.query.trips.findFirst({ where: eq(trips.id, body.tripId) });
    if (!trip) throw new HTTPException(404, { message: "Trip not found" });
    const pin = await db.query.pins.findFirst({ where: eq(pins.id, trip.pinId) });
    if (!pin) throw new HTTPException(404, { message: "Pin not found" });
    await requireMembership(me.id, pin.circleId);
    const existing = await db.select().from(photos).where(eq(photos.tripId, trip.id));
    const photoId = id("pho");
    await db.insert(photos).values({
      id: photoId,
      circleId: pin.circleId,
      tripId: trip.id,
      storageKey: body.storageKey,
      caption: body.caption,
      contentType: body.contentType,
      addedBy: me.id,
      sortOrder: existing.length,
    });
    if (!trip.coverPhotoId) {
      await db.update(trips).set({ coverPhotoId: photoId, updatedAt: new Date() }).where(eq(trips.id, trip.id));
    }
    return c.json(
      {
        photo: {
          id: photoId,
          url: publicPhotoUrl(body.storageKey),
          caption: body.caption,
        },
      },
      201,
    );
  });

export const photoFileRoutes = new Hono()
  .get("/photos/file/*", async (c) => {
    const storageKey = c.req.path.replace(/^\/api\/photos\/file\//, "");
    const object = await getObjectStream(storageKey);
    if (!object) throw new HTTPException(404, { message: "Photo not found" });
    return new Response(Readable.toWeb(object.stream) as unknown as ReadableStream, {
      headers: {
        "content-type": object.contentType,
        "cache-control": "public, max-age=86400",
      },
    });
  });
