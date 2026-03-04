import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { healthRoutes } from "../../src/routes/health.js";

function makeApp(env = {}) {
  const app = new Hono();
  healthRoutes(app);
  return { app, env };
}

describe("health routes", () => {
  it("GET /health returns status ok", async () => {
    const { app } = makeApp();
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("chittyproof");
  });

  it("GET /api/v1/status returns service metadata", async () => {
    const { app } = makeApp();
    const res = await app.request("/api/v1/status", {}, {
      SERVICE_NAME: "chittyproof",
      SERVICE_VERSION: "1.0.0",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.service).toBe("chittyproof");
    expect(body.version).toBe("1.0.0");
    expect(body.status).toBe("ok");
    expect(typeof body.uptime_ms).toBe("number");
  });
});
