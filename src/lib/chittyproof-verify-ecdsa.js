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

import { hashSignedPayload } from "./chittyproof-v2-canonical.js";

const DEFAULT_CHITTYCERT_JWKS_URL = "https://cert.chitty.cc/.well-known/jwks.json";
const DEFAULT_CACHE_TTL_SECONDS = 6 * 60 * 60;

function normalizeBase64Url(value) {
  return value.replace(/-/g, "+").replace(/_/g, "/");
}

export function b64urlToBytes(value) {
  const normalized = normalizeBase64Url(value);
  const padding = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
  const binary = atob(normalized + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bytesToB64url(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function hexToBytes(value) {
  const hex = value.startsWith("sha256:") ? value.slice(7) : value;
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error("Invalid sha256 hex");
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i += 1) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function isP256Jwk(jwk) {
  return (
    jwk &&
    jwk.kty === "EC" &&
    jwk.crv === "P-256" &&
    typeof jwk.kid === "string" &&
    typeof jwk.x === "string" &&
    typeof jwk.y === "string"
  );
}

function compactJwk(jwk) {
  return {
    kty: "EC",
    crv: "P-256",
    kid: jwk.kid,
    x: jwk.x,
    y: jwk.y,
    use: jwk.use || "sig",
    alg: jwk.alg || "ES256",
  };
}

export async function importP256Jwk(jwk) {
  return crypto.subtle.importKey(
    "jwk",
    compactJwk(jwk),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"],
  );
}

function resolveJwksUrls(env) {
  const urls = [];
  const certUrl = env.CHITTYCERT_JWKS_URL || DEFAULT_CHITTYCERT_JWKS_URL;
  urls.push(certUrl);
  if (env.CHITTYPROOF_JWKS_URL && env.CHITTYPROOF_JWKS_URL !== certUrl) {
    urls.push(env.CHITTYPROOF_JWKS_URL);
  }
  return urls;
}

/**
 * Resolve and import public key by KID, using KV cache and JWKS fetch.
 */
export async function getPublicKeyByKid(
  kid,
  env,
  { cacheTtlSeconds = DEFAULT_CACHE_TTL_SECONDS } = {},
) {
  const cacheKey = `jwks:${kid}`;

  const cached = await env.PROOF_KEY_CACHE?.get(cacheKey);
  if (cached) {
    return importP256Jwk(JSON.parse(cached));
  }

  let found = null;
  for (const jwksUrl of resolveJwksUrls(env)) {
    let jwks;
    try {
      const resp = await fetch(jwksUrl, {
        headers: { Accept: "application/json" },
      });
      if (!resp.ok) {
        continue;
      }
      jwks = await resp.json();
    } catch {
      continue;
    }

    const keys = Array.isArray(jwks?.keys) ? jwks.keys.filter(isP256Jwk) : [];
    for (const key of keys) {
      await env.PROOF_KEY_CACHE?.put(`jwks:${key.kid}`, JSON.stringify(compactJwk(key)), {
        expirationTtl: cacheTtlSeconds,
      });
      if (key.kid === kid) {
        found = key;
      }
    }
    if (found) {
      break;
    }
  }

  if (!found) {
    throw new Error(`Unknown kid: ${kid}`);
  }

  return importP256Jwk(found);
}

/**
 * Verify bundle signature over signed_fields_hash bytes.
 */
export async function verifyECDSA(bundle, env, { recomputeHash = true } = {}) {
  const signature = bundle?.signature;
  if (!signature) return { ok: false, reason: "missing_signature" };
  if (signature.alg !== "ECDSA-P256") return { ok: false, reason: "bad_alg" };
  if (!signature.kid) return { ok: false, reason: "missing_kid" };
  if (!signature.sig) return { ok: false, reason: "missing_sig" };
  if (!signature.signed_fields_hash) {
    return { ok: false, reason: "missing_signed_fields_hash" };
  }

  const sigFormat = signature.sig_format || "raw_rs_64";
  if (!["raw_rs_64", "der"].includes(sigFormat)) {
    return { ok: false, reason: "bad_sig_format" };
  }

  try {
    if (recomputeHash) {
      const expected = await hashSignedPayload(bundle);
      if (expected !== signature.signed_fields_hash) {
        return {
          ok: false,
          reason: "signed_fields_hash_mismatch",
          signed_fields_hash_expected: expected,
          signed_fields_hash_got: signature.signed_fields_hash,
        };
      }
    }

    const hashBytes = hexToBytes(signature.signed_fields_hash);
    const sigBytes = b64urlToBytes(signature.sig);
    if (sigFormat === "raw_rs_64" && sigBytes.length !== 64) {
      return { ok: false, reason: "sig_not_raw_rs_64" };
    }

    const key = await getPublicKeyByKid(signature.kid, env);
    const ok = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      sigBytes,
      hashBytes,
    );

    return { ok, reason: ok ? "ok" : "bad_signature", kid: signature.kid };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith("Unknown kid:")) {
      return { ok: false, reason: "unknown_kid", error: message };
    }
    return { ok: false, reason: "verification_error", error: message };
  }
}
