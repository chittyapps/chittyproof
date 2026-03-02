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
