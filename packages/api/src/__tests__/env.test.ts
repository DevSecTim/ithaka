import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validateEnv } from "../env";

describe("Environment Validation", () => {
  it("should validate required environment variables", () => {
    // This test runs with env vars set in setup.ts
    expect(() => validateEnv()).not.toThrow();
  });
  
  it("should include DATABASE_URL in schema", () => {
    const env = validateEnv();
    expect(env.DATABASE_URL).toBeDefined();
    expect(env.DATABASE_URL).toContain("postgres://");
  });
  
  it("should include BETTER_AUTH_SECRET in schema", () => {
    const env = validateEnv();
    expect(env.BETTER_AUTH_SECRET).toBeDefined();
    expect(env.BETTER_AUTH_SECRET.length).toBeGreaterThanOrEqual(32);
  });
  
  it("should have default values for optional fields", () => {
    const env = validateEnv();
    expect(env.WEB_URL).toBe("http://localhost:3000");
    expect(env.API_PORT).toBe("3001");
  });
});
