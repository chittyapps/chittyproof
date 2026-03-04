import { Hono } from "hono";
import { logger } from "hono/logger";
import { registerRoutes } from "./routes";

type Bindings = Env;

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());

registerRoutes(app);

export default app;
