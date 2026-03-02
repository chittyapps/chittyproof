/**
 * ChittyProof Cloudflare Worker — Hono HTTP layer.
 *
 * Wraps the pure-function library core with authenticated HTTP endpoints
 * at proof.chitty.cc.
 *
 * @module src/worker
 * @canon chittycanon://core/services/chittyproof
 */

import { Hono } from "hono";
import { bearerAuth } from "./middleware/auth.js";
import { healthRoutes } from "./routes/health.js";
import { verifyRoutes } from "./routes/verify.js";
import { canonicalizeRoutes } from "./routes/canonicalize.js";
import { hashRoutes } from "./routes/hash.js";
import { validateRoutes } from "./routes/validate.js";

const app = new Hono();

// Global error handler — surface library errors as 400 bad_request
app.onError((err, c) => {
  return c.json({ error: "bad_request", message: err.message }, 400);
});

// Public routes (no auth)
healthRoutes(app);

// Authenticated routes
app.use("/api/v1/verify", bearerAuth);
app.use("/api/v1/canonicalize", bearerAuth);
app.use("/api/v1/hash", bearerAuth);
app.use("/api/v1/validate", bearerAuth);
verifyRoutes(app);
canonicalizeRoutes(app);
hashRoutes(app);
validateRoutes(app);

// 404 fallback
app.notFound((c) => {
  return c.json({ error: "not_found", message: `${c.req.method} ${c.req.path} not found` }, 404);
});

export default app;
