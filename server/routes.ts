import { Hono } from "hono";
import { getStorage } from "./storage";

type Bindings = Env;

export function registerRoutes(app: Hono<{ Bindings: Bindings }>) {
  // prefix all routes with /api
  // use getStorage(c.env.HYPERDRIVE) to get a storage instance per request

  app.get("/api/health", (c) => {
    return c.json({ status: "ok" });
  });
}
