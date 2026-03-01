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

const SCORE_11_MAX = 11;
const SCORE_100_MAX = 100;
const ROUNDING_EPSILON = 1e-12;

/**
 * Round half-up to N decimal places.
 *
 * @param {number} value
 * @param {number} decimals
 * @returns {number}
 */
export function roundN(value, decimals) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error("roundN requires a finite number");
  }
  const factor = 10 ** decimals;
  const rounded =
    Math.sign(numeric) *
    (Math.round(Math.abs(numeric) * factor + ROUNDING_EPSILON) / factor);
  return Object.is(rounded, -0) ? 0 : rounded;
}

function roundField(obj, key, decimals) {
  if (obj[key] === undefined) return;
  obj[key] = roundN(obj[key], decimals);
}

function stripNulls(value) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => stripNulls(entry));
  }

  if (typeof value === "object") {
    const out = {};
    for (const [key, entry] of Object.entries(value)) {
      const normalized = stripNulls(entry);
      if (normalized !== undefined) {
        out[key] = normalized;
      }
    }
    return out;
  }

  return value;
}

/**
 * Normalize all score fields with deterministic rounding.
 *
 * @param {object} bundle
 * @returns {object}
 */
export function normalizeBundle(bundle) {
  if (!bundle || typeof bundle !== "object") {
    throw new Error("normalizeBundle requires a bundle object");
  }
  const normalized = structuredClone(bundle);
  if (!normalized.score || typeof normalized.score !== "object") {
    throw new Error("normalizeBundle requires a score object");
  }

  roundField(normalized.score, "score_11", 2);
  roundField(normalized.score, "score_adj_11", 2);
  roundField(normalized.score, "coverage", 4);
  roundField(normalized.score, "confidence", 4);

  if (normalized.score.score_11 === undefined) {
    throw new Error("normalizeBundle requires score.score_11");
  }

  normalized.score.score_100 = Math.max(
    0,
    Math.min(
      SCORE_100_MAX,
      Math.round((normalized.score.score_11 / SCORE_11_MAX) * SCORE_100_MAX),
    ),
  );

  if (normalized.pillars && typeof normalized.pillars === "object") {
    for (const key of Object.keys(normalized.pillars)) {
      const pillar = normalized.pillars[key];
      if (!pillar || typeof pillar !== "object") continue;
      roundField(pillar, "raw", 4);
      roundField(pillar, "score", 4);
      roundField(pillar, "weight", 4);
      roundField(pillar, "confidence", 4);
    }
  }

  return normalized;
}

/**
 * Deterministic JSON canonicalization:
 * - object keys sorted lexicographically at every level
 * - arrays preserve order
 * - minified JSON output
 *
 * @param {unknown} value
 * @returns {string}
 */
export function canonicalize(value) {
  if (value === null) return "null";

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Non-finite number in canonicalization payload");
    }
    return Object.is(value, -0) ? "0" : JSON.stringify(value);
  }

  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return JSON.stringify(value);

  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  }

  if (typeof value === "object" && value !== undefined) {
    const keys = Object.keys(value).sort();
    const pairs = [];
    for (const key of keys) {
      const entry = value[key];
      if (entry === undefined) continue;
      pairs.push(`${JSON.stringify(key)}:${canonicalize(entry)}`);
    }
    return `{${pairs.join(",")}}`;
  }

  throw new Error(`Unsupported type in canonicalization payload: ${typeof value}`);
}

/**
 * Canonical JSON for signing:
 * - normalize numeric precision
 * - exclude signature
 * - optionally exclude artifacts
 * - omit null fields
 *
 * @param {object} bundle
 * @param {object} [opts]
 * @param {boolean} [opts.excludeArtifacts]
 * @returns {string}
 */
export function canonicalSignedPayload(bundle, { excludeArtifacts = true } = {}) {
  const normalized = normalizeBundle(bundle);
  delete normalized.signature;
  if (excludeArtifacts) {
    delete normalized.artifacts;
  }

  const withoutNulls = stripNulls(normalized);
  return canonicalize(withoutNulls);
}

/**
 * SHA-256 over UTF-8 payload.
 *
 * @param {string} inputUtf8
 * @returns {Promise<string>} "sha256:<hex>"
 */
export async function sha256Hex(inputUtf8) {
  const encoded = new TextEncoder().encode(inputUtf8);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hex}`;
}

/**
 * Compute the signed payload hash for a FACT v2 bundle.
 *
 * @param {object} bundle
 * @returns {Promise<string>}
 */
export async function hashSignedPayload(bundle) {
  return sha256Hex(canonicalSignedPayload(bundle));
}

/**
 * Verify the signed payload hash consistency (hash-only verification).
 *
 * @param {object} bundle
 * @returns {Promise<{ok: boolean, signed_fields_hash_expected: string, signed_fields_hash_got: string | undefined}>}
 */
export async function verifyBundle(bundle) {
  const expected = await hashSignedPayload(bundle);
  const got = bundle?.signature?.signed_fields_hash;

  return {
    ok: expected === got,
    signed_fields_hash_expected: expected,
    signed_fields_hash_got: got,
  };
}
