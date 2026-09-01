import { db } from "@ithaka/db";
import { circleMembers, circles, invites, user } from "@ithaka/db/schema";
import { canInvite, canManageCircle, canRemoveMembers, createCircleSchema, createInviteSchema, updateCircleSchema } from "@ithaka/shared";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../context";
import { requireMembership } from "../context";
import { id } from "../ids";

export const circleRoutes = new Hono<AppEnv>()
  .get("/", async (c) => {
    const me = c.get("user");
    const rows = await db
      .select({
        id: circles.id,
        name: circles.name,
        plan: circles.plan,
        role: circleMembers.role,
        createdAt: circles.createdAt,
      })
      .from(circleMembers)
      .innerJoin(circles, eq(circleMembers.circleId, circles.id))
      .where(eq(circleMembers.userId, me.id));

    const withMembers = await Promise.all(
      rows.map(async (circle) => {
        const members = await db
          .select({
            id: circleMembers.id,
            role: circleMembers.role,
            userId: user.id,
            name: user.name,
            image: user.image,
          })
          .from(circleMembers)
          .innerJoin(user, eq(circleMembers.userId, user.id))
          .where(eq(circleMembers.circleId, circle.id));
        return { ...circle, members };
      }),
    );

    return c.json({ circles: withMembers });
  })
  .post("/", async (c) => {
    const me = c.get("user");
    const body = createCircleSchema.parse(await c.req.json());
    const circleId = id("cir");
    await db.insert(circles).values({ id: circleId, name: body.name });
    await db.insert(circleMembers).values({
      id: id("mem"),
      circleId,
      userId: me.id,
      role: "organizer",
    });
    return c.json({ circle: { id: circleId, name: body.name, role: "organizer" } }, 201);
  })
  .get("/:circleId", async (c) => {
    const me = c.get("user");
    const circleId = c.req.param("circleId");
    const membership = await requireMembership(me.id, circleId);
    const circle = await db.query.circles.findFirst({ where: eq(circles.id, circleId) });
    const members = await db
      .select({
        id: circleMembers.id,
        role: circleMembers.role,
        userId: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(circleMembers)
      .innerJoin(user, eq(circleMembers.userId, user.id))
      .where(eq(circleMembers.circleId, circleId));
    return c.json({ circle: { ...circle, role: membership.role, members } });
  })
  .patch("/:circleId", async (c) => {
    const me = c.get("user");
    const circleId = c.req.param("circleId");
    const membership = await requireMembership(me.id, circleId);
    if (!canManageCircle(membership.role)) {
      throw new HTTPException(403, { message: "Only an organizer can rename this circle" });
    }
    const body = updateCircleSchema.parse(await c.req.json());
    if (body.name) {
      await db.update(circles).set({ name: body.name, updatedAt: new Date() }).where(eq(circles.id, circleId));
    }
    return c.json({ ok: true });
  })
  .delete("/:circleId", async (c) => {
    const me = c.get("user");
    const circleId = c.req.param("circleId");
    const membership = await requireMembership(me.id, circleId);
    if (!canManageCircle(membership.role)) {
      throw new HTTPException(403, { message: "Only an organizer can delete this circle" });
    }
    await db.delete(circles).where(eq(circles.id, circleId));
    return c.json({ ok: true });
  })
  .post("/:circleId/invites", async (c) => {
    const me = c.get("user");
    const circleId = c.req.param("circleId");
    const membership = await requireMembership(me.id, circleId);
    if (!canInvite(membership.role)) {
      throw new HTTPException(403, { message: "This role cannot create invites" });
    }
    const body = createInviteSchema.parse(await c.req.json().catch(() => ({})));
    const token = id("inv");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
    await db.insert(invites).values({
      id: id("invite"),
      circleId,
      token,
      role: body.role,
      createdBy: me.id,
      expiresAt,
    });
    const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
    return c.json({
      invite: {
        token,
        role: body.role,
        expiresAt,
        url: `${webUrl}/invite/${token}`,
      },
    }, 201);
  })
  .delete("/:circleId/members/:userId", async (c) => {
    const me = c.get("user");
    const circleId = c.req.param("circleId");
    const targetUserId = c.req.param("userId");
    const membership = await requireMembership(me.id, circleId);
    if (targetUserId !== me.id && !canRemoveMembers(membership.role)) {
      throw new HTTPException(403, { message: "Only an organizer can remove people" });
    }
    if (targetUserId === me.id && membership.role === "organizer") {
      const organizers = await db
        .select()
        .from(circleMembers)
        .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.role, "organizer")));
      if (organizers.length <= 1) {
        throw new HTTPException(400, { message: "Add another organizer before leaving" });
      }
    }
    await db
      .delete(circleMembers)
      .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, targetUserId)));
    return c.json({ ok: true });
  });
