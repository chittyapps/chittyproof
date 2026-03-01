---
uri: chittycanon://docs/tech/architecture/chittyproof
namespace: chittycanon://docs/tech
type: architecture
version: 1.0.0
status: PENDING
registered_with: chittycanon://core/services/canon
title: "ChittyProof"
certifier: chittycanon://core/services/chittycertify
visibility: PUBLIC
author: "ChittyOS Infrastructure"
created: 2026-03-01T00:00:00Z
modified: 2026-03-01T00:00:00Z
tags: [cryptography, integrity, ecdsa, tier-0]
category: infrastructure
---

# ChittyProof

> `chittycanon://core/services/chittyproof` | Tier 0 (Trust Anchors) | proof.chitty.cc

## What It Does

Cryptographic integrity library for FACT v2 bundles. Provides deterministic JSON canonicalization, SHA-256 hashing, and ECDSA P-256 signature verification — the foundation that makes every fact in the ChittyOS ecosystem provably tamper-evident.

## Architecture

Pure JavaScript ESM library consumed by ChittyOS services. Runs anywhere the Web Crypto API is available (Cloudflare Workers, Node 20+, Deno, browsers).

### Stack
- **Language**: JavaScript (ESM)
- **Crypto**: Web Crypto API (SHA-256, ECDSA P-256)
- **Testing**: Vitest
- **Key Authority**: ChittyCert JWKS (`cert.chitty.cc/.well-known/jwks.json`)

### Key Components
- `src/lib/chittyproof-v2-canonical.js` — Canonicalization, normalization, hashing
- `src/lib/chittyproof-verify-ecdsa.js` — ECDSA P-256 verification, JWKS resolution
- `etc/authority/schema/chittyproof-v2-fact-bundle.schema.json` — FACT v2 bundle schema
- `tests/helpers/fact-proof-bundle.js` — Test fixture factory

### Design Principles
- **Deterministic**: Same input always produces the same canonical JSON and hash, across all runtimes
- **Court-grade**: Rounding uses half-up with epsilon guard for audit reproducibility
- **Zero dependencies**: Only Web Crypto API — no npm crypto packages
- **Edge-native**: Designed for Cloudflare Workers, no Node-only APIs

## ChittyOS Ecosystem

### Certification
- **Badge**: ChittyOS Compatible
- **Certifier**: ChittyCertify (`chittycanon://core/services/chittycertify`)
- **Last Certified**: 2026-03-01

### ChittyDNA
- **Lineage**: root (foundational library)
- **Role**: Integrity primitive — consumed by any service that mints, seals, or verifies FACT bundles

### Dependencies
| Service | Purpose |
|---------|---------|
| ChittyCert | JWKS public key hosting for signature verification |

### Consumers
| Service | Usage |
|---------|-------|
| ChittyScore | Hash verification of scored FACT bundles |
| ChittyEvidence | Evidence integrity checks |
| ChittyLedger | Seal verification at ledger write |
| ChittyCases | Bundle verification for case presentation |

### Exports
| Module | Key Functions |
|--------|--------------|
| `chittyproof-v2-canonical.js` | `canonicalize`, `normalizeBundle`, `hashSignedPayload`, `verifyBundle` |
| `chittyproof-verify-ecdsa.js` | `verifyECDSA`, `getPublicKeyByKid`, `importP256Jwk` |

### Schema
| ID | Path |
|----|------|
| `chittycanon://schemas/chittyproof/v2/fact-bundle` | `etc/authority/schema/chittyproof-v2-fact-bundle.schema.json` |
