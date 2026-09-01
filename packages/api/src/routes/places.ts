import { geocodeQuerySchema } from "@ithaka/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../context";
import { reverseGeocode, searchPlaces } from "../geocode";

const reverseSchema = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lng: z.coerce.number().gte(-180).lte(180),
});

export const placeRoutes = new Hono<AppEnv>()
  .get("/places", async (c) => {
    const { q } = geocodeQuerySchema.parse({ q: c.req.query("q") });
    const places = await searchPlaces(q);
    return c.json({ places });
  })
  .get("/places/reverse", async (c) => {
    const { lat, lng } = reverseSchema.parse({ lat: c.req.query("lat"), lng: c.req.query("lng") });
    const place = await reverseGeocode(lat, lng);
    return c.json({ place });
  });
