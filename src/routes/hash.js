/**
 * Hash endpoint.
 *
 * POST /api/v1/hash — SHA-256 of canonical signed payload.
 *
 * @canon chittycanon://core/services/chittyproof
 */

import { hashSignedPayload } from "../lib/chittyproof-v2-canonical.js";

export function hashRoutes(app) {
  app.post("/api/v1/hash", async (c) => {
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "bad_request", message: "invalid JSON" }, 400);
    }

    const { bundle } = body;
    if (!bundle || typeof bundle !== "object") {
      return c.json({ error: "bad_request", message: "bundle is required" }, 400);
    }

    try {
      const signed_fields_hash = await hashSignedPayload(bundle);
      return c.json({ signed_fields_hash });
    } catch (err) {
      return c.json({ error: "bad_request", message: err.message }, 400);
    }
  });
}
