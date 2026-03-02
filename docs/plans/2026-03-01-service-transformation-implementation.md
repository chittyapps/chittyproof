# ChittyProof Service Transformation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform ChittyProof from library-only to dual-export (SDK + Hono Worker at proof.chitty.cc), adding 6 HTTP endpoints while keeping all existing library code unchanged.

**Architecture:** Add a Hono HTTP layer (`src/worker.js`) that wraps the existing pure-function core (`src/lib/`). SDK consumers continue importing from `src/index.js`. HTTP consumers reach `proof.chitty.cc`. Auth is shared-secret Bearer token matching the ecosystem pattern. All existing 10 tests must continue passing.

**Tech Stack:** Hono (HTTP framework), Cloudflare Workers, vitest (testing), existing Web Crypto API core

---

### Task 1: Project Setup — Install Hono and Update package.json

**Files:**
- Modify: `package.json`

**Context:** The project currently has only `vitest` as a devDependency. We need `hono` as a production dependency and a `wrangler` dev dependency. The `exports` map needs to stay the same for library consumers. We also need a `deploy` script.

**Step 1: Install hono**

Run: `npm install hono`
Expected: `hono` appears in `dependencies` in package.json

**Step 2: Install wrangler as devDependency**

Run: `npm install -D wrangler`
Expected: `wrangler` appears in `devDependencies`

**Step 3: Update package.json scripts and main field**

Edit `package.json` to add these fields (keep everything else the same):

```json
{
  "main": "src/worker.js",
  "scripts": {
    "test": "vitest run",
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  }
}
```

**Step 4: Verify existing tests still pass**

Run: `npm test`
Expected: All 10 tests pass (5 canonical + 4 ECDSA + 1 schema = 10 total, grouped into fewer `it` blocks)

**Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add hono and wrangler dependencies for service layer"
```

---

### Task 2: Create wrangler.toml

**Files:**
- Create: `wrangler.toml`

**Context:** This configures the Cloudflare Worker deployment. The KV namespace ID is TBD until created via `wrangler kv namespace create`. Use a placeholder for now. Secrets (`CHITTY_AUTH_SERVICE_TOKEN`, `CHITTYCERT_JWKS_URL`) are set via `wrangler secret put`, not in this file.

**Step 1: Create wrangler.toml**

Create `wrangler.toml` with this exact content:

```toml
name = "chittyproof"
main = "src/worker.js"
compatibility_date = "2025-09-01"
compatibility_flags = ["nodejs_compat"]

[observability]
enabled = true

[[tail_consumers]]
service = "chittytrack"

[routes]
pattern = "proof.chitty.cc/*"
zone_name = "chitty.cc"

[vars]
SERVICE_NAME = "chittyproof"
SERVICE_VERSION = "1.0.0"

[[kv_namespaces]]
binding = "PROOF_KEY_CACHE"
id = "TBD"
```

**Step 2: Commit**

```bash
git add wrangler.toml
git commit -m "chore: add wrangler.toml for Cloudflare Worker deployment"
```

---

### Task 3: SDK Re-export — src/index.js

**Files:**
- Create: `src/index.js`

**Context:** This file re-exports all public functions from both library modules so SDK consumers can do `import { verifyBundle, verifyECDSA } from '@chitty/chittyproof'`. The existing `package.json` exports map points subpaths directly at the lib files — this index.js provides the convenience "barrel" import.

**Step 1: Create src/index.js**

```javascript
/**
 * ChittyProof SDK — re-exports all public library functions.
 *
 * @module src/index
 * @canon chittycanon://core/services/chittyproof
 */

export {
  roundN,
  normalizeBundle,
  canonicalize,
  canonicalSignedPayload,
  sha256Hex,
  hashSignedPayload,
  verifyBundle,
} from "./lib/chittyproof-v2-canonical.js";

export {
  b64urlToBytes,
  bytesToB64url,
  hexToBytes,
  importP256Jwk,
  getPublicKeyByKid,
  verifyECDSA,
} from "./lib/chittyproof-verify-ecdsa.js";
```

**Step 2: Verify tests still pass**

Run: `npm test`
Expected: All tests pass (index.js is inert — just re-exports)

**Step 3: Commit**

```bash
git add src/index.js
git commit -m "feat: add SDK barrel export (src/index.js)"
```

---

### Task 4: Auth Middleware

**Files:**
- Create: `src/middleware/auth.js`
- Create: `tests/middleware/auth.test.js`

**Context:** The ecosystem uses shared-secret Bearer tokens. Every service checks `Authorization: Bearer <token>` against `env.CHITTY_AUTH_SERVICE_TOKEN`. This matches the pattern verified in chittyfinance middleware. The `/health` endpoint is PUBLIC — only `/api/v1/*` routes (except `/api/v1/status`) need auth.

**Step 1: Write the failing test**

Create `tests/middleware/auth.test.js`:

```javascript
import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { bearerAuth } from "../../src/middleware/auth.js";

function makeApp() {
  const app = new Hono();
  app.use("/api/v1/*", bearerAuth);
  app.get("/api/v1/test", (c) => c.json({ ok: true }));
  return app;
}

describe("bearerAuth middleware", () => {
  it("returns 401 when no Authorization header is present", async () => {
    const app = makeApp();
    const res = await app.request("/api/v1/test", {}, { CHITTY_AUTH_SERVICE_TOKEN: "secret-123" });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthorized");
  });

  it("returns 401 when token does not match", async () => {
    const app = makeApp();
    const res = await app.request(
      "/api/v1/test",
      { headers: { Authorization: "Bearer wrong-token" } },
      { CHITTY_AUTH_SERVICE_TOKEN: "secret-123" },
    );
    expect(res.status).toBe(401);
  });

  it("passes through when token matches", async () => {
    const app = makeApp();
    const res = await app.request(
      "/api/v1/test",
      { headers: { Authorization: "Bearer secret-123" } },
      { CHITTY_AUTH_SERVICE_TOKEN: "secret-123" },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns 401 when CHITTY_AUTH_SERVICE_TOKEN is not configured", async () => {
    const app = makeApp();
    const res = await app.request(
      "/api/v1/test",
      { headers: { Authorization: "Bearer anything" } },
      {},
    );
    expect(res.status).toBe(401);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/middleware/auth.test.js`
Expected: FAIL — module `../../src/middleware/auth.js` does not exist

**Step 3: Write minimal implementation**

Create `src/middleware/auth.js`:

```javascript
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
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/middleware/auth.test.js`
Expected: 4 tests PASS

**Step 5: Run all tests**

Run: `npm test`
Expected: All existing + new tests pass

**Step 6: Commit**

```bash
git add src/middleware/auth.js tests/middleware/auth.test.js
git commit -m "feat: add shared-secret Bearer token auth middleware"
```

---

### Task 5: Health Routes

**Files:**
- Create: `src/routes/health.js`
- Create: `tests/routes/health.test.js`

**Context:** Every ChittyOS service must have `GET /health` (returns `{"status":"ok","service":"chittyproof"}`) and `GET /api/v1/status` (returns service metadata). These are the endpoints that ChittyRegister and ChittyBeacon probe. `/health` is public, `/api/v1/status` is public (informational).

**Step 1: Write the failing test**

Create `tests/routes/health.test.js`:

```javascript
import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { healthRoutes } from "../../src/routes/health.js";

function makeApp(env = {}) {
  const app = new Hono();
  healthRoutes(app);
  return { app, env };
}

describe("health routes", () => {
  it("GET /health returns status ok", async () => {
    const { app } = makeApp();
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("chittyproof");
  });

  it("GET /api/v1/status returns service metadata", async () => {
    const { app } = makeApp();
    const res = await app.request("/api/v1/status", {}, {
      SERVICE_NAME: "chittyproof",
      SERVICE_VERSION: "1.0.0",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.service).toBe("chittyproof");
    expect(body.version).toBe("1.0.0");
    expect(body.status).toBe("ok");
    expect(typeof body.uptime_ms).toBe("number");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/routes/health.test.js`
Expected: FAIL — module does not exist

**Step 3: Write minimal implementation**

Create `src/routes/health.js`:

```javascript
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
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/routes/health.test.js`
Expected: 2 tests PASS

**Step 5: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/routes/health.js tests/routes/health.test.js
git commit -m "feat: add /health and /api/v1/status endpoints"
```

---

### Task 6: Verify Route

**Files:**
- Create: `src/routes/verify.js`
- Create: `tests/routes/verify.test.js`

**Context:** `POST /api/v1/verify` accepts a FACT v2 bundle in the request body, runs both hash integrity verification (`verifyBundle`) and optionally ECDSA signature verification (`verifyECDSA`). This is the primary endpoint — the one ChittyEvidence, ChittyLedger, ChittyScore, and ChittyCases will call. The request body is `{ bundle: <object>, ecdsa?: boolean }`. When `ecdsa` is true (default), it also verifies the ECDSA signature. When false, it only checks hash integrity.

**Step 1: Write the failing test**

Create `tests/routes/verify.test.js`:

```javascript
import { describe, it, expect, vi, beforeEach } from "vitest";
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
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/routes/verify.test.js`
Expected: FAIL — module does not exist

**Step 3: Write minimal implementation**

Create `src/routes/verify.js`:

```javascript
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
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/routes/verify.test.js`
Expected: 3 tests PASS

**Step 5: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/routes/verify.js tests/routes/verify.test.js
git commit -m "feat: add POST /api/v1/verify endpoint (hash + ECDSA)"
```

---

### Task 7: Canonicalize Route

**Files:**
- Create: `src/routes/canonicalize.js`
- Create: `tests/routes/canonicalize.test.js`

**Context:** `POST /api/v1/canonicalize` accepts `{ payload: <any> }` and returns the deterministic canonical JSON string. This is useful for consumers that need to canonicalize data before signing externally (e.g., ChittySign).

**Step 1: Write the failing test**

Create `tests/routes/canonicalize.test.js`:

```javascript
import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { canonicalizeRoutes } from "../../src/routes/canonicalize.js";

function makeApp() {
  const app = new Hono();
  canonicalizeRoutes(app);
  return app;
}

describe("POST /api/v1/canonicalize", () => {
  it("returns canonical JSON for an object", async () => {
    const app = makeApp();
    const res = await app.request("/api/v1/canonicalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: { z: 1, a: { y: true, x: false } } }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.canonical).toBe('{"a":{"x":false,"y":true},"z":1}');
  });

  it("returns 400 when payload is missing", async () => {
    const app = makeApp();
    const res = await app.request("/api/v1/canonicalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/routes/canonicalize.test.js`
Expected: FAIL — module does not exist

**Step 3: Write minimal implementation**

Create `src/routes/canonicalize.js`:

```javascript
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
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/routes/canonicalize.test.js`
Expected: 2 tests PASS

**Step 5: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/routes/canonicalize.js tests/routes/canonicalize.test.js
git commit -m "feat: add POST /api/v1/canonicalize endpoint"
```

---

### Task 8: Hash Route

**Files:**
- Create: `src/routes/hash.js`
- Create: `tests/routes/hash.test.js`

**Context:** `POST /api/v1/hash` accepts a FACT v2 bundle and returns its canonical signed-payload hash. Used by ChittySign and ChittyScore to get the hash for external signing or pre-verification.

**Step 1: Write the failing test**

Create `tests/routes/hash.test.js`:

```javascript
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
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/routes/hash.test.js`
Expected: FAIL — module does not exist

**Step 3: Write minimal implementation**

Create `src/routes/hash.js`:

```javascript
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
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/routes/hash.test.js`
Expected: 2 tests PASS

**Step 5: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/routes/hash.js tests/routes/hash.test.js
git commit -m "feat: add POST /api/v1/hash endpoint"
```

---

### Task 9: Validate Route

**Files:**
- Create: `src/routes/validate.js`
- Create: `tests/routes/validate.test.js`

**Context:** `POST /api/v1/validate` validates a JSON object against the FACT v2 bundle schema. Uses the schema at `etc/authority/schema/chittyproof-v2-fact-bundle.schema.json`. Since Cloudflare Workers don't have a built-in JSON Schema validator, we implement basic structural validation using the schema's `required` and `properties` definitions.

Note: Full JSON Schema validation (with `$ref`, `$defs`, `additionalProperties`, `pattern`) requires a library like `ajv`. However, `ajv` is large. For v1 we implement required-field and top-level type checking. A future iteration can add `ajv` if full schema validation is needed.

**Step 1: Write the failing test**

Create `tests/routes/validate.test.js`:

```javascript
import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { validateRoutes } from "../../src/routes/validate.js";
import { makeFactProofBundle } from "../helpers/fact-proof-bundle.js";

function makeApp() {
  const app = new Hono();
  validateRoutes(app);
  return app;
}

describe("POST /api/v1/validate", () => {
  it("returns valid for a well-formed FACT v2 bundle", async () => {
    const bundle = makeFactProofBundle();

    const app = makeApp();
    const res = await app.request("/api/v1/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bundle }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.errors).toHaveLength(0);
  });

  it("returns invalid when required fields are missing", async () => {
    const app = makeApp();
    const res = await app.request("/api/v1/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bundle: { proof_version: "2.0.0" } }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.errors.length).toBeGreaterThan(0);
  });

  it("returns invalid when proof_version is wrong", async () => {
    const bundle = makeFactProofBundle({ proof_version: "1.0.0" });

    const app = makeApp();
    const res = await app.request("/api/v1/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bundle }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.errors).toContainEqual(
      expect.objectContaining({ field: "proof_version" }),
    );
  });

  it("returns 400 when bundle is missing", async () => {
    const app = makeApp();
    const res = await app.request("/api/v1/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/routes/validate.test.js`
Expected: FAIL — module does not exist

**Step 3: Write minimal implementation**

Create `src/routes/validate.js`:

```javascript
/**
 * Schema validation endpoint.
 *
 * POST /api/v1/validate — validate a bundle against FACT v2 schema.
 * Checks required fields, const values, and top-level structure.
 *
 * @canon chittycanon://core/services/chittyproof
 */

import schema from "../../etc/authority/schema/chittyproof-v2-fact-bundle.schema.json" with { type: "json" };

function validateRequired(obj, requiredFields, path) {
  const errors = [];
  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null) {
      errors.push({ field: path ? `${path}.${field}` : field, error: "required" });
    }
  }
  return errors;
}

function validateConst(obj, field, expected, path) {
  const fullPath = path ? `${path}.${field}` : field;
  if (obj[field] !== undefined && obj[field] !== expected) {
    return [{ field: fullPath, error: `must be "${expected}", got "${obj[field]}"` }];
  }
  return [];
}

export function validateRoutes(app) {
  app.post("/api/v1/validate", async (c) => {
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

    const errors = [];

    // Top-level required fields
    errors.push(...validateRequired(bundle, schema.required, ""));

    // Const values
    errors.push(...validateConst(bundle, "proof_version", "2.0.0", ""));
    errors.push(...validateConst(bundle, "ruleset_id", "chittyproof-v2-fact-default", ""));

    // Nested required fields
    if (bundle.fact && typeof bundle.fact === "object") {
      errors.push(...validateRequired(bundle.fact, schema.properties.fact.required, "fact"));
      errors.push(...validateConst(bundle.fact, "status", "sealed", "fact"));
    }
    if (bundle.ledger && typeof bundle.ledger === "object") {
      errors.push(...validateRequired(bundle.ledger, schema.properties.ledger.required, "ledger"));
    }
    if (bundle.chain && typeof bundle.chain === "object") {
      errors.push(...validateRequired(bundle.chain, schema.properties.chain.required, "chain"));
    }
    if (bundle.score && typeof bundle.score === "object") {
      errors.push(...validateRequired(bundle.score, schema.properties.score.required, "score"));
    }
    if (bundle.pillars && typeof bundle.pillars === "object") {
      errors.push(
        ...validateRequired(bundle.pillars, schema.properties.pillars.required, "pillars"),
      );
    }

    return c.json({ valid: errors.length === 0, errors });
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/routes/validate.test.js`
Expected: 4 tests PASS

**Step 5: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/routes/validate.js tests/routes/validate.test.js
git commit -m "feat: add POST /api/v1/validate endpoint (schema validation)"
```

---

### Task 10: Worker Entry Point — src/worker.js

**Files:**
- Create: `src/worker.js`
- Create: `tests/worker.test.js`

**Context:** This is the Hono app that wires all routes and middleware together. It's the Cloudflare Worker entry point (`main` in wrangler.toml). Public routes: `/health`, `/api/v1/status`. Authenticated routes: `/api/v1/verify`, `/api/v1/canonicalize`, `/api/v1/hash`, `/api/v1/validate`. The test verifies the full wiring works end-to-end.

**Step 1: Write the failing test**

Create `tests/worker.test.js`:

```javascript
import { describe, it, expect } from "vitest";

// Import the app from worker.js
import app from "../src/worker.js";

const ENV = {
  CHITTY_AUTH_SERVICE_TOKEN: "test-token-123",
  SERVICE_NAME: "chittyproof",
  SERVICE_VERSION: "1.0.0",
};

describe("worker (integration)", () => {
  it("GET /health is public and returns ok", async () => {
    const res = await app.request("/health", {}, ENV);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("chittyproof");
  });

  it("GET /api/v1/status is public", async () => {
    const res = await app.request("/api/v1/status", {}, ENV);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.service).toBe("chittyproof");
  });

  it("POST /api/v1/verify requires auth", async () => {
    const res = await app.request("/api/v1/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bundle: {}, ecdsa: false }),
    }, ENV);

    expect(res.status).toBe(401);
  });

  it("POST /api/v1/verify works with valid auth", async () => {
    const res = await app.request("/api/v1/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token-123",
      },
      body: JSON.stringify({ bundle: {}, ecdsa: false }),
    }, ENV);

    // 400 because empty bundle, but NOT 401
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown routes", async () => {
    const res = await app.request("/nonexistent", {}, ENV);
    expect(res.status).toBe(404);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/worker.test.js`
Expected: FAIL — module does not exist

**Step 3: Write minimal implementation**

Create `src/worker.js`:

```javascript
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
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/worker.test.js`
Expected: 5 tests PASS

**Step 5: Run ALL tests**

Run: `npm test`
Expected: ALL tests pass — existing library tests + all new route/middleware/worker tests

**Step 6: Commit**

```bash
git add src/worker.js tests/worker.test.js
git commit -m "feat: add Hono Worker entry point wiring all routes and auth"
```

---

### Task 11: Update Compliance Documents

**Files:**
- Modify: `CHARTER.md`
- Modify: `CHITTY.md`
- Modify: `CLAUDE.md`

**Context:** The service transformation changes ChittyProof from "library" to "library + service". CHARTER.md needs HTTP endpoint documentation added. CHITTY.md needs architecture update. CLAUDE.md needs developer commands for the service layer. All three documents must be consistent (the Compliance Triad).

**Step 1: Update CHARTER.md**

Key changes:
- Classification: Change `Library` to `Library + Service (dual-export)`
- Add HTTP Endpoints section to API Contract
- Add downstream consumers
- Update Dependencies to include ChittyAuth, ChittyTrack, ChittyChronicle
- Check the registry compliance checkbox

In `CHARTER.md`, replace the Classification section:
```
- **Artifact Type**: Library + Service (dual-export at proof.chitty.cc)
```

Add after the Schema section in API Contract:

```markdown
### HTTP Endpoints (proof.chitty.cc)
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | None | Health probe |
| GET | `/api/v1/status` | None | Service metadata |
| POST | `/api/v1/verify` | Bearer | Hash integrity + ECDSA verification |
| POST | `/api/v1/canonicalize` | Bearer | Deterministic JSON canonicalization |
| POST | `/api/v1/hash` | Bearer | SHA-256 of canonical signed payload |
| POST | `/api/v1/validate` | Bearer | FACT v2 bundle schema validation |
```

Update Dependencies table to add:

```markdown
| Upstream | ChittyAuth | Shared-secret Bearer token validation |
| Downstream | ChittyTrack | Automatic log/trace aggregation (tail_consumers) |
| Downstream | ChittyChronicle | Verification event emission |
| Downstream | ChittyBeacon | Health monitoring (probes /health) |
```

Update compliance checklist — check the registry box when registration succeeds.

**Step 2: Update CHITTY.md**

Update the architecture section to reflect dual-export pattern. Add the HTTP endpoint table. Update the badge section if applicable.

**Step 3: Update CLAUDE.md**

Add service commands:

```markdown
## Commands

```bash
npm test          # Run vitest (all tests)
npm run dev       # Start local dev server (wrangler dev)
npm run deploy    # Deploy to Cloudflare Workers
npx vitest run    # Same as npm test, explicit
npx vitest watch  # Watch mode
```
```

Update the Architecture section to describe dual-export:

```markdown
## Architecture

This is a **dual-export** project: a library (for in-process consumers) and a deployed service at `proof.chitty.cc` (for HTTP consumers).

- `src/index.js` — SDK barrel export (library consumers import from here)
- `src/worker.js` — Hono Worker entry point (Cloudflare Workers deployment)
- `src/lib/` — Pure function core (unchanged)
- `src/routes/` — HTTP route handlers
- `src/middleware/` — Auth middleware
```

Update the Project Structure to include new directories.

**Step 4: Run all tests one final time**

Run: `npm test`
Expected: ALL tests pass

**Step 5: Commit**

```bash
git add CHARTER.md CHITTY.md CLAUDE.md
git commit -m "docs: update compliance triad for dual-export service transformation"
```

---

### Task 12: Final Verification

**Files:** None (verification only)

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass (original 10 + new route/middleware/worker tests)

**Step 2: Verify no regressions in library exports**

Run a quick smoke test:
```bash
node -e "import('./src/index.js').then(m => console.log(Object.keys(m).join(', ')))"
```
Expected: Lists all exported function names

**Step 3: Verify worker starts locally**

Run: `npx wrangler dev --local`
Expected: Worker starts and listens on localhost. Test with:
```bash
curl -s http://localhost:8787/health | jq .
```
Expected: `{"status":"ok","service":"chittyproof"}`

Note: `wrangler dev` may fail if KV namespace ID is TBD. If so, create the namespace first:
```bash
npx wrangler kv namespace create PROOF_KEY_CACHE
```
Then update the `id` in `wrangler.toml`.

**Step 4: Review file tree**

Verify the final structure matches the design:
```
src/
  index.js                          # SDK re-export
  worker.js                         # Hono app entry point
  lib/
    chittyproof-v2-canonical.js     # UNCHANGED
    chittyproof-verify-ecdsa.js     # UNCHANGED
  routes/
    health.js                       # GET /health, GET /api/v1/status
    verify.js                       # POST /api/v1/verify
    canonicalize.js                 # POST /api/v1/canonicalize
    hash.js                         # POST /api/v1/hash
    validate.js                     # POST /api/v1/validate
  middleware/
    auth.js                         # Shared-secret Bearer token

etc/authority/schema/               # UNCHANGED
tests/
  lib/                              # Existing tests UNCHANGED
  routes/                           # New route handler tests
  middleware/                       # Auth middleware tests
  helpers/                          # Existing test helpers UNCHANGED
  worker.test.js                    # Integration test
```
