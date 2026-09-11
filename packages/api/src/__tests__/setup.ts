import { beforeAll } from "vitest";

// Set test environment variables
beforeAll(() => {
  process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
  process.env.BETTER_AUTH_SECRET = "test-secret-at-least-32-characters-long";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.WEB_URL = "http://localhost:3000";
  process.env.API_PORT = "3001";
});
