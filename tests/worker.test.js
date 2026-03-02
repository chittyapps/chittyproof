import { describe, it, expect } from "vitest";
import app from "../src/worker.js";

const ENV = {
  CHITTY_AUTH_SERVICE_TOKEN: "test-token-123",
  SERVICE_NAME: "chittyproof",
  SERVICE_VERSION: "1.0.0",
};

describe("worker (integration)", () => {
  it("GET /health is public and returns ok", async () => {
    const res = await app.request("/health", {}, ENV);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("chittyproof");
  });

  it("GET /api/v1/status is public", async () => {
    const res = await app.request("/api/v1/status", {}, ENV);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.service).toBe("chittyproof");
  });

  it("POST /api/v1/verify requires auth", async () => {
    const res = await app.request("/api/v1/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bundle: {}, ecdsa: false }),
    }, ENV);

    expect(res.status).toBe(401);
  });

  it("POST /api/v1/verify works with valid auth", async () => {
    const res = await app.request("/api/v1/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token-123",
      },
      body: JSON.stringify({ bundle: {}, ecdsa: false }),
    }, ENV);

    // 400 because empty bundle, but NOT 401
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown routes", async () => {
    const res = await app.request("/nonexistent", {}, ENV);
    expect(res.status).toBe(404);
  });
});
