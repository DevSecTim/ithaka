import { expo } from "@better-auth/expo";
import { db, account, session, user, verification } from "@ithaka/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const webUrl = process.env.WEB_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const isDevelopment = process.env.NODE_ENV !== "production";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? webUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    webUrl,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8081",
    "ithaka://",
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [expo()],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    // Disable secure cookies in development (localhost uses http://)
    useSecureCookies: !isDevelopment,
    defaultCookieAttributes: {
      sameSite: "lax",
    },
  },
});

export type Session = typeof auth.$Infer.Session;
