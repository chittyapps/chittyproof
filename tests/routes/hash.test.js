import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { hashRoutes } from "../../src/routes/hash.js";
import { hashSignedPayload } from "../../src/lib/chittyproof-v2-canonical.js";
import { makeFactProofBundle } from "../helpers/fact-proof-bundle.js";

function makeApp() {
  const app = new Hono();
  hashRoutes(app);
  return app;
}

describe("POST /api/v1/hash", () => {
  it("returns sha256 hash of canonical signed payload", async () => {
    const bundle = makeFactProofBundle();
    const expectedHash = await hashSignedPayload(bundle);

    const app = makeApp();
    const res = await app.request("/api/v1/hash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bundle }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.signed_fields_hash).toBe(expectedHash);
    expect(body.signed_fields_hash).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("returns 400 when bundle is missing", async () => {
    const app = makeApp();
    const res = await app.request("/api/v1/hash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});
