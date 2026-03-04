import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { canonicalizeRoutes } from "../../src/routes/canonicalize.js";

function makeApp() {
  const app = new Hono();
  canonicalizeRoutes(app);
  return app;
}

describe("POST /api/v1/canonicalize", () => {
  it("returns canonical JSON for an object", async () => {
    const app = makeApp();
    const res = await app.request("/api/v1/canonicalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: { z: 1, a: { y: true, x: false } } }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.canonical).toBe('{"a":{"x":false,"y":true},"z":1}');
  });

  it("returns 400 when payload is missing", async () => {
    const app = makeApp();
    const res = await app.request("/api/v1/canonicalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});
