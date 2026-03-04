import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { bearerAuth } from "../../src/middleware/auth.js";

function makeApp() {
  const app = new Hono();
  app.use("/api/v1/*", bearerAuth);
  app.get("/api/v1/test", (c) => c.json({ ok: true }));
  return app;
}

describe("bearerAuth middleware", () => {
  it("returns 401 when no Authorization header is present", async () => {
    const app = makeApp();
    const res = await app.request("/api/v1/test", {}, { CHITTY_AUTH_SERVICE_TOKEN: "secret-123" });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthorized");
  });

  it("returns 401 when token does not match", async () => {
    const app = makeApp();
    const res = await app.request(
      "/api/v1/test",
      { headers: { Authorization: "Bearer wrong-token" } },
      { CHITTY_AUTH_SERVICE_TOKEN: "secret-123" },
    );
    expect(res.status).toBe(401);
  });

  it("passes through when token matches", async () => {
    const app = makeApp();
    const res = await app.request(
      "/api/v1/test",
      { headers: { Authorization: "Bearer secret-123" } },
      { CHITTY_AUTH_SERVICE_TOKEN: "secret-123" },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns 401 when CHITTY_AUTH_SERVICE_TOKEN is not configured", async () => {
    const app = makeApp();
    const res = await app.request(
      "/api/v1/test",
      { headers: { Authorization: "Bearer anything" } },
      {},
    );
    expect(res.status).toBe(401);
  });
});
