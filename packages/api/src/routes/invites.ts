import { db } from "@ithaka/db";
import { circleMembers, circles, invites } from "@ithaka/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../context";
import { id } from "../ids";

export const inviteRoutes = new Hono<AppEnv>()
  .get("/:token", async (c) => {
    const token = c.req.param("token");
    const invite = await db.query.invites.findFirst({
      where: eq(invites.token, token),
      with: { circle: true },
    });
    if (!invite || invite.redeemedAt || invite.expiresAt < new Date()) {
      throw new HTTPException(404, { message: "This invite is no longer valid" });
    }
    return c.json({
      invite: {
        token: invite.token,
        role: invite.role,
        circle: { id: invite.circleId, name: invite.circle.name },
      },
    });
  })
  .post("/:token/accept", async (c) => {
    const me = c.get("user");
    const token = c.req.param("token");
    const invite = await db.query.invites.findFirst({
      where: and(eq(invites.token, token), isNull(invites.redeemedAt)),
    });
    if (!invite || invite.expiresAt < new Date()) {
      throw new HTTPException(404, { message: "This invite is no longer valid" });
    }

    const existing = await db.query.circleMembers.findFirst({
      where: and(eq(circleMembers.circleId, invite.circleId), eq(circleMembers.userId, me.id)),
    });
    if (!existing) {
      await db.insert(circleMembers).values({
        id: id("mem"),
        circleId: invite.circleId,
        userId: me.id,
        role: invite.role,
      });
    }

    await db
      .update(invites)
      .set({ redeemedAt: new Date(), redeemedBy: me.id })
      .where(eq(invites.id, invite.id));

    const circle = await db.query.circles.findFirst({ where: eq(circles.id, invite.circleId) });
    return c.json({ circle: { id: invite.circleId, name: circle?.name, role: existing?.role ?? invite.role } });
  });
