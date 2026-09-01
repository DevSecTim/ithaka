import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { auth } from "./auth";
import { requireUser } from "./context";
import { circleRoutes } from "./routes/circles";
import { inviteRoutes } from "./routes/invites";
import { photoFileRoutes, photoRoutes } from "./routes/photos";
import { pinRoutes } from "./routes/pins";
import { placeRoutes } from "./routes/places";
import { tripRoutes } from "./routes/trips";

const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

export const app = new Hono()
  .basePath("/api")
  .use(
    "*",
    cors({
      origin: [webUrl, "http://localhost:3000", "http://localhost:8081"],
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  )
  .onError((error, c) => {
    if (error instanceof HTTPException) {
      return c.json({ error: error.message }, error.status);
    }
    if (error instanceof ZodError) {
      return c.json({ error: "Invalid request", details: error.flatten() }, 400);
    }
    console.error(error);
    return c.json({ error: "Something went wrong" }, 500);
  })
  .get("/health", (c) => c.json({ ok: true, name: "ithaka" }))
  .all("/auth/*", (c) => auth.handler(c.req.raw))
  .route("/", photoFileRoutes)
  .use("/circles/*", requireUser)
  .use("/pins/*", requireUser)
  .use("/trips/*", requireUser)
  .use("/photos/*", requireUser)
  .use("/places/*", requireUser)
  .use("/invites/:token/accept", requireUser)
  .route("/", placeRoutes)
  .route("/circles", circleRoutes)
  .route("/invites", inviteRoutes)
  .route("/", pinRoutes)
  .route("/", tripRoutes)
  .route("/", photoRoutes);

export type App = typeof app;
