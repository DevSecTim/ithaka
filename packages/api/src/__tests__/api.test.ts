import { describe, it, expect } from "vitest";
import { app } from "../app";

describe("Health Check", () => {
  it("should return healthy status", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data).toEqual({ ok: true, name: "ithaka" });
  });
});

describe("Auth Endpoints", () => {
  it("should reject unauthorized requests to protected routes", async () => {
    const res = await app.request("/api/circles");
    expect(res.status).toBe(401);
  });
  
  it("should handle auth routes", async () => {
    // Auth handler responds to any /api/auth/* route
    // Without database, we just verify it doesn't return 500
    const res = await app.request("/api/auth/session");
    expect([200, 401, 404]).toContain(res.status);
  });
});

describe("CORS Configuration", () => {
  it("should include CORS headers for allowed origins", async () => {
    const res = await app.request("/api/health", {
      headers: {
        Origin: "http://localhost:3000",
      },
    });
    
    expect(res.headers.get("access-control-allow-origin")).toBeTruthy();
  });
});

describe("Error Handling", () => {
  it("should return 404 for non-existent routes", async () => {
    const res = await app.request("/api/nonexistent");
    expect(res.status).toBe(404);
  });
});
