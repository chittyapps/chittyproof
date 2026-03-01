# CLAUDE.md — ChittyProof

Cryptographic integrity library for FACT v2 bundle canonicalization, hashing, and ECDSA P-256 signature verification.

**Canonical URI**: `chittycanon://core/services/chittyproof`
**Tier**: 0 (Trust Anchors)
**Domain**: proof.chitty.cc

## Commands

```bash
npm test          # Run vitest (all tests)
npx vitest run    # Same, explicit
npx vitest watch  # Watch mode
```

## Project Structure

```
src/lib/
  chittyproof-v2-canonical.js   # Canonicalization, normalization, SHA-256 hashing
  chittyproof-verify-ecdsa.js   # ECDSA P-256 verification, JWKS key resolution

etc/authority/schema/
  chittyproof-v2-fact-bundle.schema.json   # FACT v2 bundle JSON Schema

tests/
  helpers/fact-proof-bundle.js             # Test fixture factory (makeFactProofBundle)
  lib/chittyproof-v2-canonical.test.js     # Canonicalization + hash tests
  lib/chittyproof-verify-ecdsa.test.js     # ECDSA verification tests
```

## Architecture

This is a **library**, not a deployable service. It exports pure functions that run on any Web Crypto API runtime (Workers, Node 20+, Deno, browsers).

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
- **ChittyCert** (`cert.chitty.cc/.well-known/jwks.json`) — public key authority
- **KV binding** (`PROOF_KEY_CACHE`) — optional JWKS cache for Workers consumers

## Patterns

- All numeric rounding uses `roundN` with half-up + epsilon guard (`1e-12`) for determinism
- `-0` is normalized to `0` everywhere (canonicalization and rounding)
- Non-finite numbers throw — no `NaN` or `Infinity` in canonical payloads
- Base64url encoding/decoding handles padding normalization internally
- `structuredClone` is used for immutable normalization (no mutation of input bundles)
