import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { validateRoutes } from "../../src/routes/validate.js";
import { makeFactProofBundle } from "../helpers/fact-proof-bundle.js";

function makeApp() {
  const app = new Hono();
  validateRoutes(app);
  return app;
}

describe("POST /api/v1/validate", () => {
  it("returns valid for a well-formed FACT v2 bundle", async () => {
    const bundle = makeFactProofBundle();

    const app = makeApp();
    const res = await app.request("/api/v1/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bundle }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.errors).toHaveLength(0);
  });

  it("returns invalid when required fields are missing", async () => {
    const app = makeApp();
    const res = await app.request("/api/v1/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bundle: { proof_version: "2.0.0" } }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.errors.length).toBeGreaterThan(0);
  });

  it("returns invalid when proof_version is wrong", async () => {
    const bundle = makeFactProofBundle({ proof_version: "1.0.0" });

    const app = makeApp();
    const res = await app.request("/api/v1/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bundle }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.errors).toContainEqual(
      expect.objectContaining({ field: "proof_version" }),
    );
  });

  it("returns 400 when bundle is missing", async () => {
    const app = makeApp();
    const res = await app.request("/api/v1/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});
