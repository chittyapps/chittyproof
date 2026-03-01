# ChittyProof Full Remediation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remediate all governance/metadata findings from Code Cardinal, Register Compliance Sergeant, and Schema Overlord audits in one coordinated pass.

**Architecture:** Five files touched — two governance docs (CHARTER.md, CHITTY.md), one package manifest (package.json), and two source modules (docblock annotations only). No implementation logic changes. All existing tests must continue passing.

**Tech Stack:** Markdown frontmatter (YAML), package.json (JSON), JSDoc annotations

**Design Doc:** `docs/plans/2026-03-01-full-remediation-design.md`

---

### Task 1: Fix CHARTER.md Frontmatter

**Files:**
- Modify: `CHARTER.md:1-11` (frontmatter block)

**Step 1: Edit the frontmatter**

Replace the entire frontmatter block (lines 1-11) with:

```yaml
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
```

Changes from original:
- `uri`: `ops` -> `tech`
- `namespace`: `ops` -> `tech`
- `status`: `DRAFT` -> `PENDING`
- Added: `author`, `created`, `modified`, `tags`, `category`

**Step 2: Verify the file parses correctly**

Run: `node -e "const f=require('fs').readFileSync('CHARTER.md','utf8'); const m=f.match(/^---\n([\s\S]*?)\n---/); console.log(m ? 'OK: frontmatter found' : 'FAIL: no frontmatter')"`

Expected: `OK: frontmatter found`

---

### Task 2: Fix CHITTY.md Frontmatter

**Files:**
- Modify: `CHITTY.md:1-11` (frontmatter block)

**Step 1: Edit the frontmatter**

Replace the entire frontmatter block (lines 1-11) with:

```yaml
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
```

Changes from original:
- `uri`: `ops` -> `tech`
- `namespace`: `ops` -> `tech`
- `status`: `DRAFT` -> `PENDING`
- Added: `author`, `created`, `modified`, `tags`, `category`

---

### Task 3: Update package.json

**Files:**
- Modify: `package.json`

**Step 1: Bump version and add exports**

Replace the full `package.json` with:

```json
{
  "name": "@chitty/chittyproof",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "import": "./src/lib/chittyproof-v2-canonical.js"
    },
    "./verify-ecdsa": {
      "import": "./src/lib/chittyproof-verify-ecdsa.js"
    },
    "./schema": {
      "import": "./etc/authority/schema/chittyproof-v2-fact-bundle.schema.json",
      "default": "./etc/authority/schema/chittyproof-v2-fact-bundle.schema.json"
    }
  },
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^4.0.16"
  }
}
```

Changes:
- `version`: `0.0.0` -> `1.0.0`
- Added `exports` with three subpaths

**Step 2: Run tests to verify nothing broke**

Run: `npm test`

Expected: 10/10 tests passing

---

### Task 4: Add @canon Tags to Source Docblocks

**Files:**
- Modify: `src/lib/chittyproof-v2-canonical.js:1-8` (docblock)
- Modify: `src/lib/chittyproof-verify-ecdsa.js:1-9` (docblock)

**Step 1: Update canonical module docblock**

Replace lines 1-8 of `src/lib/chittyproof-v2-canonical.js` with:

```javascript
/**
 * ChittyProof v2 FACT canonicalization and integrity helpers.
 *
 * Deterministic JSON output is required to produce stable hashes/signatures
 * across runtimes for audit and court-grade reproducibility.
 *
 * @module src/lib/chittyproof-v2-canonical
 * @canon chittycanon://core/services/chittyproof
 * @schema chittycanon://schemas/chittyproof/v2/fact-bundle
 */
```

Changes: Updated `@module` path to include `src/`, added `@canon` and `@schema` tags.

**Step 2: Update ECDSA module docblock**

Replace lines 1-9 of `src/lib/chittyproof-verify-ecdsa.js` with:

```javascript
/**
 * ChittyProof signature verification helpers (ECDSA P-256).
 *
 * Key authority should be externalized (ChittyCert) and consumed here via JWKS.
 * This module supports kid->JWK resolution with KV caching and deterministic
 * verification of signature + signed_fields_hash.
 *
 * @module src/lib/chittyproof-verify-ecdsa
 * @canon chittycanon://core/services/chittyproof
 * @schema chittycanon://schemas/chittyproof/v2/fact-bundle
 */
```

Changes: Updated `@module` path to include `src/`, added `@canon` and `@schema` tags.

**Step 3: Run tests to confirm docblock changes didn't break anything**

Run: `npm test`

Expected: 10/10 tests passing

---

### Task 5: Update CHARTER.md Compliance Checklist

**Files:**
- Modify: `CHARTER.md:90-97` (compliance section)

**Step 1: Update checklist**

The compliance section should read:

```markdown
## Compliance

- [ ] Service registered in ChittyRegistry
- [x] CHARTER.md present
- [x] CHITTY.md present
- [x] CLAUDE.md present
- [x] Tests passing (10/10 vitest)
- [x] JSON Schema with canonical $id
- [x] Canonical frontmatter with tech domain
- [x] Package exports map defined
```

Added two new checked items reflecting remediation work.

---

### Task 6: Cross-Document Consistency Verification

**Files:** (read-only verification, no edits)

**Step 1: Verify canonical URI consistency**

Run: `grep -n 'chittycanon://core/services/chittyproof' CHARTER.md CHITTY.md CLAUDE.md`

Expected: URI appears in all three files.

**Step 2: Verify tier consistency**

Run: `grep -n 'Tier.*0' CHARTER.md CHITTY.md CLAUDE.md`

Expected: "Tier 0" or "Tier 0 (Trust Anchors)" in all three files.

**Step 3: Verify domain consistency**

Run: `grep -n 'proof\.chitty\.cc' CHARTER.md CHITTY.md CLAUDE.md`

Expected: "proof.chitty.cc" in all three files.

**Step 4: Verify namespace is tech (not ops) everywhere**

Run: `grep -rn 'chittycanon://docs/ops' .`

Expected: No matches (all changed to `tech`).

**Step 5: Verify frontmatter status is PENDING**

Run: `grep -n 'status:' CHARTER.md CHITTY.md | head -2`

Expected: Both show `status: PENDING`.

**Step 6: Run full test suite one final time**

Run: `npm test`

Expected: 10/10 tests passing.

---

### Task 7: Commit

**Step 1: Stage all changed files**

```bash
git add CHARTER.md CHITTY.md package.json src/lib/chittyproof-v2-canonical.js src/lib/chittyproof-verify-ecdsa.js docs/plans/
```

**Step 2: Commit**

```bash
git commit -m "fix: remediate compliance findings from Code Cardinal, Register Sergeant, and Schema Overlord

- Frontmatter domain: ops -> tech (Tier 0 Trust Anchor is infrastructure, not ops)
- Frontmatter status: DRAFT -> PENDING (awaiting certification review)
- Add missing frontmatter fields: author, created, modified, tags, category
- package.json version: 0.0.0 -> 1.0.0 (matches charter declaration)
- Add exports map with three canonical import paths
- Add @canon and @schema JSDoc tags to both source modules
- Update @module paths to include src/ prefix
- Update compliance checklist

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
