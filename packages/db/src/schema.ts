import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

function timestamps() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  };
}

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  ...timestamps(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    issuer: text("issuer").notNull().default("local:credential"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const circles = pgTable("circles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  coverPhotoId: text("cover_photo_id"),
  plan: text("plan").notNull().default("free"),
  ...timestamps(),
});

export const circleMembers = pgTable(
  "circle_members",
  {
    id: text("id").primaryKey(),
    circleId: text("circle_id")
      .notNull()
      .references(() => circles.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("circle_members_circle_user_idx").on(t.circleId, t.userId),
    index("circle_members_user_id_idx").on(t.userId),
  ],
);

export const pins = pgTable(
  "pins",
  {
    id: text("id").primaryKey(),
    circleId: text("circle_id")
      .notNull()
      .references(() => circles.id, { onDelete: "cascade" }),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    placeName: text("place_name").notNull(),
    countryCode: text("country_code"),
    status: text("status").notNull().default("wishlist"),
    note: text("note"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    ...timestamps(),
  },
  (t) => [index("pins_circle_id_idx").on(t.circleId)],
);

export const pinWishes = pgTable(
  "pin_wishes",
  {
    id: text("id").primaryKey(),
    pinId: text("pin_id")
      .notNull()
      .references(() => pins.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("pin_wishes_pin_user_idx").on(t.pinId, t.userId)],
);

export const trips = pgTable(
  "trips",
  {
    id: text("id").primaryKey(),
    pinId: text("pin_id")
      .notNull()
      .references(() => pins.id, { onDelete: "cascade" }),
    startDate: date("start_date"),
    endDate: date("end_date"),
    coverPhotoId: text("cover_photo_id"),
    note: text("note"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    ...timestamps(),
  },
  (t) => [index("trips_pin_id_idx").on(t.pinId)],
);

export const tripTravelers = pgTable(
  "trip_travelers",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("trip_travelers_trip_user_idx").on(t.tripId, t.userId)],
);

export const photos = pgTable(
  "photos",
  {
    id: text("id").primaryKey(),
    circleId: text("circle_id")
      .notNull()
      .references(() => circles.id, { onDelete: "cascade" }),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    caption: text("caption"),
    contentType: text("content_type"),
    addedBy: text("added_by")
      .notNull()
      .references(() => user.id),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps(),
  },
  (t) => [index("photos_trip_id_idx").on(t.tripId), index("photos_circle_id_idx").on(t.circleId)],
);

export const invites = pgTable(
  "invites",
  {
    id: text("id").primaryKey(),
    circleId: text("circle_id")
      .notNull()
      .references(() => circles.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    role: text("role").notNull().default("member"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    redeemedBy: text("redeemed_by").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("invites_circle_id_idx").on(t.circleId)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  memberships: many(circleMembers),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const circleRelations = relations(circles, ({ many }) => ({
  members: many(circleMembers),
  pins: many(pins),
  invites: many(invites),
}));

export const circleMemberRelations = relations(circleMembers, ({ one }) => ({
  circle: one(circles, { fields: [circleMembers.circleId], references: [circles.id] }),
  user: one(user, { fields: [circleMembers.userId], references: [user.id] }),
}));

export const pinRelations = relations(pins, ({ one, many }) => ({
  circle: one(circles, { fields: [pins.circleId], references: [circles.id] }),
  creator: one(user, { fields: [pins.createdBy], references: [user.id] }),
  wishes: many(pinWishes),
  trips: many(trips),
}));

export const pinWishRelations = relations(pinWishes, ({ one }) => ({
  pin: one(pins, { fields: [pinWishes.pinId], references: [pins.id] }),
  user: one(user, { fields: [pinWishes.userId], references: [user.id] }),
}));

export const tripRelations = relations(trips, ({ one, many }) => ({
  pin: one(pins, { fields: [trips.pinId], references: [pins.id] }),
  travelers: many(tripTravelers),
  photos: many(photos),
}));

export const tripTravelerRelations = relations(tripTravelers, ({ one }) => ({
  trip: one(trips, { fields: [tripTravelers.tripId], references: [trips.id] }),
  user: one(user, { fields: [tripTravelers.userId], references: [user.id] }),
}));

export const photoRelations = relations(photos, ({ one }) => ({
  trip: one(trips, { fields: [photos.tripId], references: [trips.id] }),
  circle: one(circles, { fields: [photos.circleId], references: [circles.id] }),
}));

export const inviteRelations = relations(invites, ({ one }) => ({
  circle: one(circles, { fields: [invites.circleId], references: [circles.id] }),
}));
