/**
 * Bundle verification endpoint.
 *
 * POST /api/v1/verify — hash integrity + optional ECDSA verification.
 *
 * @canon chittycanon://core/services/chittyproof
 */

import { verifyBundle } from "../lib/chittyproof-v2-canonical.js";
import { verifyECDSA } from "../lib/chittyproof-verify-ecdsa.js";

export function verifyRoutes(app) {
  app.post("/api/v1/verify", async (c) => {
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "bad_request", message: "invalid JSON" }, 400);
    }

    const { bundle, ecdsa = true } = body;
    if (!bundle || typeof bundle !== "object") {
      return c.json({ error: "bad_request", message: "bundle is required" }, 400);
    }

    const hashResult = await verifyBundle(bundle);
    const result = {
      hash_ok: hashResult.ok,
      signed_fields_hash_expected: hashResult.signed_fields_hash_expected,
      signed_fields_hash_got: hashResult.signed_fields_hash_got,
    };

    if (ecdsa && hashResult.ok) {
      const ecdsaResult = await verifyECDSA(bundle, c.env);
      result.ecdsa = {
        ok: ecdsaResult.ok,
        reason: ecdsaResult.reason,
        kid: ecdsaResult.kid,
      };
    }

    return c.json(result);
  });
}
