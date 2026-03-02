/**
 * Shared-secret Bearer token middleware.
 *
 * Matches the ecosystem pattern: compare incoming Bearer token
 * against env.CHITTY_AUTH_SERVICE_TOKEN.
 *
 * @canon chittycanon://core/services/chittyproof
 */

export async function bearerAuth(c, next) {
  const expected = c.env.CHITTY_AUTH_SERVICE_TOKEN;
  if (!expected) {
    return c.json({ error: "unauthorized", message: "auth not configured" }, 401);
  }

  const header = c.req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token || token !== expected) {
    return c.json({ error: "unauthorized" }, 401);
  }

  await next();
}
