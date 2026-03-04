/**
 * Canonicalization endpoint.
 *
 * POST /api/v1/canonicalize — deterministic JSON output.
 *
 * @canon chittycanon://core/services/chittyproof
 */

import { canonicalize } from "../lib/chittyproof-v2-canonical.js";

export function canonicalizeRoutes(app) {
  app.post("/api/v1/canonicalize", async (c) => {
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "bad_request", message: "invalid JSON" }, 400);
    }

    if (!("payload" in body)) {
      return c.json({ error: "bad_request", message: "payload is required" }, 400);
    }

    try {
      const canonical = canonicalize(body.payload);
      return c.json({ canonical });
    } catch (err) {
      return c.json({ error: "bad_request", message: err.message }, 400);
    }
  });
}
