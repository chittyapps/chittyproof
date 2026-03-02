import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { verifyRoutes } from "../../src/routes/verify.js";
import { hashSignedPayload } from "../../src/lib/chittyproof-v2-canonical.js";
import { makeFactProofBundle } from "../helpers/fact-proof-bundle.js";

function makeApp() {
  const app = new Hono();
  verifyRoutes(app);
  return app;
}

describe("POST /api/v1/verify", () => {
  it("returns hash verification result for a valid bundle (ecdsa=false)", async () => {
    const bundle = makeFactProofBundle();
    bundle.signature.signed_fields_hash = await hashSignedPayload(bundle);

    const app = makeApp();
    const res = await app.request("/api/v1/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bundle, ecdsa: false }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hash_ok).toBe(true);
    expect(body.ecdsa).toBeUndefined();
  });

  it("returns hash mismatch for a tampered bundle", async () => {
    const bundle = makeFactProofBundle();
    // Don't set the hash to match — it will mismatch

    const app = makeApp();
    const res = await app.request("/api/v1/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bundle, ecdsa: false }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hash_ok).toBe(false);
  });

  it("returns 400 when bundle is missing", async () => {
    const app = makeApp();
    const res = await app.request("/api/v1/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("bad_request");
  });
});
