import { z } from "zod";
import { CIRCLE_ROLES, PIN_STATUSES } from "./roles";

export const createCircleSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const updateCircleSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
});

export const createInviteSchema = z.object({
  role: z.enum(CIRCLE_ROLES).default("member"),
});

export const createPinSchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  placeName: z.string().trim().min(1).max(160),
  countryCode: z.string().trim().length(2).optional(),
  status: z.enum(PIN_STATUSES).default("wishlist"),
  note: z.string().trim().max(2000).optional(),
});

export const updatePinSchema = z.object({
  placeName: z.string().trim().min(1).max(160).optional(),
  status: z.enum(PIN_STATUSES).optional(),
  note: z.string().trim().max(2000).nullable().optional(),
  countryCode: z.string().trim().length(2).nullable().optional(),
});

export const convertPinSchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  travelerIds: z.array(z.string()).optional(),
  note: z.string().trim().max(2000).optional(),
});

export const createTripSchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  note: z.string().trim().max(4000).optional(),
  travelerIds: z.array(z.string()).optional(),
});

export const updateTripSchema = z.object({
  startDate: z.string().date().nullable().optional(),
  endDate: z.string().date().nullable().optional(),
  note: z.string().trim().max(4000).nullable().optional(),
  travelerIds: z.array(z.string()).optional(),
  coverPhotoId: z.string().nullable().optional(),
});

export const createPhotoSchema = z.object({
  tripId: z.string(),
  storageKey: z.string().min(1),
  caption: z.string().trim().max(280).optional(),
  contentType: z.string().optional(),
});

export const geocodeQuerySchema = z.object({
  q: z.string().trim().min(2).max(200),
});

export const pinFilterSchema = z.object({
  status: z.enum(["all", ...PIN_STATUSES]).default("all"),
  mine: z.coerce.boolean().optional(),
});
