# ChittyProof Service Transformation Design

**Date**: 2026-03-01
**Scope**: Transform ChittyProof from library-only to dual-export library + deployable service
**Approach**: Add Hono HTTP layer on Cloudflare Workers, keep library core unchanged

## Context

ChittyProof is currently a pure library. It should be both a library (for in-process consumers) and a deployed service at `proof.chitty.cc` (for HTTP consumers and revenue generation). This follows the established dual-export pattern (e.g., DocuMint: `index.js` for SDK, `worker.js` for HTTP).

## Verified Ecosystem Context

All integration points verified via health checks and code inspection on 2026-03-01.

### Services confirmed live

| Service | Domain | Health | Version | Registry |
|---------|--------|--------|---------|----------|
| ChittyCert(ify) | cert.chitty.cc | healthy | 2.0.0 | UNVERIFIED |
| ChittyAuth | auth.chitty.cc | healthy | 1.0.0 | YES |
| ChittySchema | schema.chitty.cc | healthy | 2.0.0 | YES |
| ChittyTrack | track.chitty.cc | ok | 1.0.0 | UNVERIFIED |
| ChittyChronicle | chronicle.chitty.cc | QUESTIONABLE (returns `[]`) | — | YES |
| ChittyRegister | register.chitty.cc | HEALTHY | 2.0.0 | YES |
| ChittyRouter | router.chitty.cc | healthy (AI-powered) | — | YES |
| ChittyConnect | connect.chitty.cc | healthy | 2.0.2 | YES |
| ChittyBeacon | beacon.chitty.cc | healthy | 1.0.0 | YES |
| ChittyGateway | gateway.chitty.cc | auth-gated (401) | — | YES |
| ChittyCharge | charge.chitty.cc | healthy | 1.0.0 | YES |

### Critical finding: JWKS endpoint

`cert.chitty.cc/.well-known/jwks.json` returns 404 ("Not found"). ChittyProof's `getPublicKeyByKid` depends on this endpoint. ECDSA verification cannot resolve public keys in production until the JWKS endpoint is deployed on ChittyCert. The library allows a fallback `CHITTYPROOF_JWKS_URL` env var, which the service layer should support.

### Auth pattern (verified from chittyfinance middleware)

Services use **shared-secret Bearer tokens**, not JWT scope validation:
```
Authorization: Bearer ${CHITTY_AUTH_SERVICE_TOKEN}
```
Consumer middleware does simple string comparison. The ChittyAuth API defines scope-based token endpoints (`/api/v1/tokens/service`, `/api/v1/tokens/verify`) but no consumer currently uses JWT decoding. ChittyProof should match the current ecosystem reality (shared-secret) with a path to JWT when the ecosystem migrates.

### External AI API routing (verified from chittyfinance + chittycontextual)

External AI calls (OpenAI, Claude, etc.) route through Cloudflare AI Gateway via `AI_GATEWAY_ENDPOINT` env var (`https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_name}/{provider}`). ChittyProof does not make AI calls, so this does not apply. If AI capabilities are added later, use this pattern.

### Billing/charging

ChittyCharge exists at `charge.chitty.cc` (Stripe integration) but is not fully configured (`stripe_connected: false`, `chittyid_connected: false`). No internal per-API-call metering service exists. ChittyProof should not implement billing logic — emit usage events to ChittyChronicle for future consumption by ChittyCharge when it's operational.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| HTTP framework | Hono | Ecosystem standard (DocuMint, etc.) |
| Auth | Shared-secret Bearer token (match ecosystem reality) | JWT scope validation not implemented in any consumer |
| JWKS fallback | Support `CHITTYCERT_JWKS_URL` + `CHITTYPROOF_JWKS_URL` env vars | `cert.chitty.cc/.well-known/jwks.json` is 404 |
| Billing | Emit events to ChittyChronicle, no billing logic | ChittyCharge not fully configured |
| AI Gateway | N/A (no AI calls) | Cryptographic operations only |
| Observability | `[[tail_consumers]]` to chittytrack | Verified ecosystem pattern |

## Architecture

### Dual-export pattern

```
src/index.js          ← SDK export (library consumers)
src/worker.js         ← Hono Worker (HTTP consumers at proof.chitty.cc)
src/lib/              ← Pure function core (UNCHANGED)
```

### API surface

| Endpoint | Method | Purpose | Calls |
|----------|--------|---------|-------|
| `/health` | GET | Health check (ChittyRegister requirement) | — |
| `/api/v1/status` | GET | Service metadata, uptime, key cache stats | — |
| `/api/v1/verify` | POST | Hash integrity + ECDSA signature verification | `verifyBundle` + `verifyECDSA` |
| `/api/v1/canonicalize` | POST | Deterministic JSON canonicalization | `canonicalize` |
| `/api/v1/hash` | POST | SHA-256 hash of canonical signed payload | `hashSignedPayload` |
| `/api/v1/validate` | POST | JSON Schema validation of FACT v2 bundle | Local schema file |

### Auth middleware

Match ecosystem reality:
```javascript
// Shared-secret Bearer token (current pattern)
const token = req.header('authorization')?.slice(7);
if (!token || token !== env.CHITTY_AUTH_SERVICE_TOKEN) return 401;
```

### Project structure

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
```

### Wrangler config

```toml
name = "chittyproof"
main = "src/worker.js"
compatibility_date = "2025-09-01"

[observability]
enabled = true

[[tail_consumers]]
service = "chittytrack"

routes = [
  { pattern = "proof.chitty.cc/*", zone_name = "chitty.cc" }
]

[vars]
SERVICE_NAME = "chittyproof"
SERVICE_VERSION = "1.0.0"

[[kv_namespaces]]
binding = "PROOF_KEY_CACHE"
id = "TBD"

# Secrets (set via wrangler secret put):
# CHITTY_AUTH_SERVICE_TOKEN
# CHITTYCERT_JWKS_URL (fallback until cert.chitty.cc JWKS is deployed)
```

### Ecosystem integrations

| Integration | Method | What ChittyProof Does |
|-------------|--------|----------------------|
| ChittyCert | HTTPS fetch to JWKS URL | Resolve ECDSA public keys by kid (already in library) |
| ChittyAuth | Shared-secret Bearer token validation | Authenticate incoming requests |
| ChittySchema | Local schema file (authority of record) | Validate FACT v2 bundles against schema |
| ChittyTrack | Cloudflare tail_consumers | Automatic log/trace aggregation (no code needed) |
| ChittyChronicle | POST to chronicle.chitty.cc/api/events | Emit verification success/failure events |
| ChittyBeacon | Passive (ChittyBeacon probes /health) | Health monitoring (no code needed) |
| ChittyRegister | POST to register.chitty.cc/api/v1/register | Service registration (now has /health + /api/v1/status) |
| ChittyConnect | Upstream gateway | External consumers reach proof.chitty.cc through ChittyConnect proxy |

### Consumers (who calls proof.chitty.cc)

| Consumer | Endpoint | Usage |
|----------|----------|-------|
| ChittyEvidence | `/api/v1/verify` | Verify bundle integrity before accepting evidence |
| ChittyLedger | `/api/v1/verify` | Verify seals at ledger write |
| ChittyScore | `/api/v1/hash` + `/api/v1/verify` | Hash scored bundles, verify before scoring |
| ChittyCases | `/api/v1/verify` | Verify bundles for case presentation |
| ChittySign | `/api/v1/hash` | Get canonical hash for signing counterpart |
| DocuMint | `/api/v1/verify` | Already uses library — can also call HTTP |

SDK consumers (direct import) continue unchanged.

### Dependencies to add

- `hono` — HTTP framework
- No `jose` needed — auth is shared-secret, not JWT

## Out of scope

- JWT scope-based auth (no consumer implements it yet)
- AI Gateway integration (no AI calls)
- Billing/metering logic (ChittyCharge not operational)
- JWKS endpoint deployment on ChittyCert (separate service issue)
- Schema registration with ChittySchema API (local schema is authority)

## Blockers

1. **JWKS endpoint on ChittyCert**: `cert.chitty.cc/.well-known/jwks.json` returns 404. ECDSA verification will fail until this is deployed. Mitigation: `CHITTYPROOF_JWKS_URL` env var allows pointing to an alternative JWKS source.
2. **ChittyChronicle health**: Returns `[]` instead of proper health response. Event emission may not work. Mitigation: Non-blocking — log errors but don't fail requests.

## Verification

- All 10 existing tests must continue passing
- New route/middleware tests must pass
- `curl -s https://proof.chitty.cc/health` must return proper health response
- Registration at `register.chitty.cc/api/v1/register` must succeed (previously blocked by missing /health endpoint)
