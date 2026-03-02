/**
 * Health and status endpoints.
 *
 * GET /health — public health probe (ChittyRegister / ChittyBeacon)
 * GET /api/v1/status — service metadata
 *
 * @canon chittycanon://core/services/chittyproof
 */

const START_TIME = Date.now();

export function healthRoutes(app) {
  app.get("/health", (c) => {
    return c.json({ status: "ok", service: "chittyproof" });
  });

  app.get("/api/v1/status", (c) => {
    return c.json({
      service: c.env.SERVICE_NAME || "chittyproof",
      version: c.env.SERVICE_VERSION || "unknown",
      status: "ok",
      uptime_ms: Date.now() - START_TIME,
    });
  });
}
