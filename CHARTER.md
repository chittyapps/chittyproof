---
uri: chittycanon://docs/tech/policy/chittyproof-charter
namespace: chittycanon://docs/tech
type: policy
version: 1.0.0
status: PENDING
registered_with: chittycanon://core/services/canon
title: "ChittyProof Charter"
certifier: chittycanon://core/services/chittycertify
visibility: PUBLIC
author: "ChittyOS Infrastructure"
created: 2026-03-01T00:00:00Z
modified: 2026-03-01T00:00:00Z
tags: [cryptography, canonicalization, integrity, tier-0]
category: infrastructure
---

# ChittyProof Charter

## Classification
- **Canonical URI**: `chittycanon://core/services/chittyproof`
- **Tier**: 0 (Trust Anchors)
- **Organization**: CHITTYOS
- **Domain**: proof.chitty.cc
- **Artifact Type**: Library (consumed by services, not deployed standalone)

## Mission

Provide deterministic, court-grade cryptographic integrity primitives for the ChittyOS ecosystem — canonicalization, hashing, and ECDSA signature verification of FACT v2 bundles.

## Scope

### IS Responsible For
- Deterministic JSON canonicalization (sorted keys, minified, null-stripped)
- Half-up rounding of score and pillar numeric fields for reproducible hashes
- SHA-256 hashing of canonical payloads (`sha256:<hex>` format)
- ECDSA P-256 signature verification over signed_fields_hash
- JWKS key resolution with KV caching (kid-based lookup via ChittyCert)
- Defining the authoritative FACT v2 bundle JSON Schema
- Providing `normalizeBundle` / `canonicalSignedPayload` / `verifyBundle` / `verifyECDSA` exports

### IS NOT Responsible For
- Signing bundles (signing authority lives in the minting service)
- Key generation or rotation (ChittyCert)
- JWKS hosting (ChittyCert at `cert.chitty.cc/.well-known/jwks.json`)
- FACT scoring logic (ChittyScore)
- Ledger sealing or chain anchoring (ChittyLedger / ChittyChain)
- Identity generation (ChittyID)

## Dependencies

| Type | Service | Purpose |
|------|---------|---------|
| Upstream | ChittyCert | JWKS endpoint for public key resolution |
| Runtime | Web Crypto API | SHA-256 digest, ECDSA verify, key import |
| Optional | Cloudflare KV | JWKS key caching (`PROOF_KEY_CACHE` binding) |

## API Contract

ChittyProof is a library — it exports functions, not HTTP endpoints.

### Exports (`lib/chittyproof-v2-canonical.js`)
| Export | Signature | Purpose |
|--------|-----------|---------|
| `roundN` | `(value, decimals) => number` | Deterministic half-up rounding |
| `normalizeBundle` | `(bundle) => object` | Normalize score/pillar precision, compute score_100 |
| `canonicalize` | `(value) => string` | Sorted-key minified JSON |
| `canonicalSignedPayload` | `(bundle, opts?) => string` | Canonical JSON for signing (excludes signature/artifacts) |
| `sha256Hex` | `(inputUtf8) => Promise<string>` | SHA-256 as `sha256:<hex>` |
| `hashSignedPayload` | `(bundle) => Promise<string>` | Hash of canonical signed payload |
| `verifyBundle` | `(bundle) => Promise<{ok, ...}>` | Hash-only integrity check |

### Exports (`lib/chittyproof-verify-ecdsa.js`)
| Export | Signature | Purpose |
|--------|-----------|---------|
| `b64urlToBytes` | `(value) => Uint8Array` | Base64url decode |
| `bytesToB64url` | `(bytes) => string` | Base64url encode |
| `hexToBytes` | `(value) => Uint8Array` | SHA-256 hex to bytes |
| `importP256Jwk` | `(jwk) => Promise<CryptoKey>` | Import ECDSA P-256 public key |
| `getPublicKeyByKid` | `(kid, env, opts?) => Promise<CryptoKey>` | KV-cached JWKS key resolution |
| `verifyECDSA` | `(bundle, env, opts?) => Promise<{ok, reason, ...}>` | Full ECDSA signature verification |

### Schema
- `etc/authority/schema/chittyproof-v2-fact-bundle.schema.json`
- `$id`: `chittycanon://schemas/chittyproof/v2/fact-bundle`

## Ownership

| Role | Owner |
|------|-------|
| Service Owner | ChittyOS |
| Technical Lead | @chittyos-infrastructure |
| Contact | chittyproof@chitty.cc |

## Compliance

- [ ] Service registered in ChittyRegistry
- [x] CHARTER.md present
- [x] CHITTY.md present
- [x] CLAUDE.md present
- [x] Tests passing (10/10 vitest)
- [x] JSON Schema with canonical $id
- [x] Canonical frontmatter with tech domain
- [x] Package exports map defined

---
*Charter Version: 1.0.0 | Last Updated: 2026-03-01*
