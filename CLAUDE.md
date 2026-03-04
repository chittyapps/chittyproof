# CLAUDE.md — ChittyProof

Cryptographic integrity library and service for FACT v2 bundle canonicalization, hashing, and ECDSA P-256 signature verification.

**Canonical URI**: `chittycanon://core/services/chittyproof`
**Tier**: 0 (Trust Anchors)
**Domain**: proof.chitty.cc

## Commands

```bash
npm test          # Run vitest (all tests)
npm run dev       # Start local dev server (wrangler dev)
npm run deploy    # Deploy to Cloudflare Workers
npx vitest run    # Same as npm test, explicit
npx vitest watch  # Watch mode
```

## Project Structure

```
src/
  index.js                          # SDK barrel export (library consumers)
  worker.js                         # Hono Worker entry point (HTTP consumers)
  lib/
    chittyproof-v2-canonical.js     # Canonicalization, normalization, SHA-256 hashing
    chittyproof-verify-ecdsa.js     # ECDSA P-256 verification, JWKS key resolution
  routes/
    health.js                       # GET /health, GET /api/v1/status
    verify.js                       # POST /api/v1/verify
    canonicalize.js                 # POST /api/v1/canonicalize
    hash.js                         # POST /api/v1/hash
    validate.js                     # POST /api/v1/validate
  middleware/
    auth.js                         # Shared-secret Bearer token

etc/authority/schema/
  chittyproof-v2-fact-bundle.schema.json   # FACT v2 bundle JSON Schema

tests/
  helpers/fact-proof-bundle.js             # Test fixture factory (makeFactProofBundle)
  lib/chittyproof-v2-canonical.test.js     # Canonicalization + hash tests
  lib/chittyproof-verify-ecdsa.test.js     # ECDSA verification tests
  middleware/auth.test.js                  # Auth middleware tests
  routes/                                  # Route handler tests
  worker.test.js                           # Integration tests
```

## Architecture

This is a **dual-export** project: a library (for in-process consumers) and a deployed service at `proof.chitty.cc` (for HTTP consumers).

- `src/index.js` — SDK barrel export (library consumers import from here)
- `src/worker.js` — Hono Worker entry point (Cloudflare Workers deployment)
- `src/lib/` — Pure function core (unchanged from library-only days)
- `src/routes/` — HTTP route handlers wrapping the library functions
- `src/middleware/` — Auth middleware (shared-secret Bearer token)

### Canonicalization Pipeline
1. `normalizeBundle` — round score/pillar fields to deterministic precision, compute `score_100`
2. Strip `signature` and `artifacts` fields
3. `stripNulls` — remove null/undefined values
4. `canonicalize` — sort keys lexicographically at every depth, produce minified JSON
5. `sha256Hex` — SHA-256 digest as `sha256:<hex>`

### ECDSA Verification Flow
1. Recompute `signed_fields_hash` from bundle fields (canonicalize + hash)
2. Compare against `bundle.signature.signed_fields_hash`
3. Resolve public key by `kid` from ChittyCert JWKS (with KV caching)
4. `crypto.subtle.verify` ECDSA P-256 over the hash bytes

### Key Dependencies
- **Hono** — HTTP framework for Cloudflare Workers
- **ChittyCert** (`cert.chitty.cc/.well-known/jwks.json`) — public key authority
- **ChittyAuth** — shared-secret Bearer token (`CHITTY_AUTH_SERVICE_TOKEN`)
- **KV binding** (`PROOF_KEY_CACHE`) — optional JWKS cache for Workers consumers

## Patterns

- All numeric rounding uses `roundN` with half-up + epsilon guard (`1e-12`) for determinism
- `-0` is normalized to `0` everywhere (canonicalization and rounding)
- Non-finite numbers throw — no `NaN` or `Infinity` in canonical payloads
- Base64url encoding/decoding handles padding normalization internally
- `structuredClone` is used for immutable normalization (no mutation of input bundles)
- Routes are thin wrappers around library functions — no business logic in route handlers
- Auth middleware uses simple string comparison against `env.CHITTY_AUTH_SERVICE_TOKEN`
