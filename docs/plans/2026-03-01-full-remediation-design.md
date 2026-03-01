# ChittyProof Full Remediation Design

**Date**: 2026-03-01
**Scope**: Remediate all findings from Code Cardinal, Register Compliance Sergeant, and Schema Overlord audits
**Approach**: Single coordinated pass across 5 files

## Context

ChittyProof is a Tier 0 (Trust Anchors) cryptographic integrity library for FACT v2 bundle canonicalization, SHA-256 hashing, and ECDSA P-256 signature verification. Three agents audited the project and identified governance/metadata issues — the implementation code itself is compliant.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Certifier URI | `chittycanon://core/services/chittycertify` (keep) | ChittyCertify is the distinct compliance certification service |
| Frontmatter domain | `tech` (change from `ops`) | Tier 0 Trust Anchors are core infrastructure, not operational tooling |
| Document status | `PENDING` (change from `DRAFT`) | Remediation complete, awaiting certification review |

## Changes

### 1. CHARTER.md Frontmatter

- `uri`: `chittycanon://docs/ops/policy/chittyproof-charter` -> `chittycanon://docs/tech/policy/chittyproof-charter`
- `namespace`: `chittycanon://docs/ops` -> `chittycanon://docs/tech`
- `status`: `DRAFT` -> `PENDING`
- Add: `author`, `created`, `modified`, `tags`, `category`

### 2. CHITTY.md Frontmatter

- `uri`: `chittycanon://docs/ops/architecture/chittyproof` -> `chittycanon://docs/tech/architecture/chittyproof`
- `namespace`: `chittycanon://docs/ops` -> `chittycanon://docs/tech`
- `status`: `DRAFT` -> `PENDING`
- Add: `author`, `created`, `modified`, `tags`, `category`

### 3. package.json

- `version`: `0.0.0` -> `1.0.0`
- Add `exports` map with three canonical import paths:
  - `.` -> canonical module (canonicalize, normalize, hash, verify)
  - `./verify-ecdsa` -> ECDSA verification module
  - `./schema` -> FACT v2 bundle JSON Schema

### 4. Source Code Docblocks

Add `@canon` and `@schema` tags to both module docblocks:
- `src/lib/chittyproof-v2-canonical.js`
- `src/lib/chittyproof-verify-ecdsa.js`

### 5. CHARTER.md Compliance Checklist

Update checkboxes to reflect current state after remediation.

## Out of Scope (Deferred)

- Schema P1 recommendations (URI format annotations, minItems, proof_id format) — deferred to schema stabilization
- Organization discrepancy (CHITTYAPPS vs CHITTYOS) — architectural decision
- Schema `$id` namespace registration (`schemas` vs `core/schemas`) — broader canonical namespace discussion
- Pillar weight maximum tightening — requires scoring model analysis

## Verification

- Re-run `npm test` (10/10 must still pass)
- Grep cross-document consistency (URI, tier, domain)
