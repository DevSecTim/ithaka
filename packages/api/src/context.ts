import { db } from "@ithaka/db";
import { circleMembers } from "@ithaka/db/schema";
import type { CircleRole } from "@ithaka/shared";
import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { auth } from "./auth";

export type AuthedUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

export type AppEnv = {
  Variables: {
    user: AuthedUser;
  };
};

export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Sign in to continue" });
  }
  c.set("user", {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  });
  await next();
});

export async function requireMembership(userId: string, circleId: string) {
  const membership = await db.query.circleMembers.findFirst({
    where: and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)),
  });
  if (!membership) {
    throw new HTTPException(404, { message: "Circle not found" });
  }
  return { ...membership, role: membership.role as CircleRole };
}
