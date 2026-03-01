import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  bytesToB64url,
  getPublicKeyByKid,
  hexToBytes,
  verifyECDSA,
} from "../../src/lib/chittyproof-verify-ecdsa.js";
import { hashSignedPayload } from "../../src/lib/chittyproof-v2-canonical.js";
import { makeFactProofBundle } from "../helpers/fact-proof-bundle.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeKv(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    get: vi.fn(async (key) => store.get(key) || null),
    put: vi.fn(async (key, value) => {
      store.set(key, value);
    }),
    _store: store,
  };
}

async function buildSignedBundle({ kid = "proof-p256-2026-02-23-01" } = {}) {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const jwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  jwk.kid = kid;
  jwk.use = "sig";
  jwk.alg = "ES256";

  const bundle = makeFactProofBundle({
    signature: {
      kid,
      sig: "",
      sig_format: "raw_rs_64",
    },
  });
  const signedHash = await hashSignedPayload(bundle);
  bundle.signature.signed_fields_hash = signedHash;

  const hashBytes = hexToBytes(signedHash);
  const sigBytes = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      keyPair.privateKey,
      hashBytes,
    ),
  );
  bundle.signature.sig = bytesToB64url(sigBytes);

  return { bundle, jwk };
}

describe("chittyproof-verify-ecdsa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches JWKS on cache miss and verifies signature", async () => {
    const { bundle, jwk } = await buildSignedBundle();
    const env = {
      CHITTYCERT_JWKS_URL: "https://cert.chitty.cc/.well-known/jwks.json",
      PROOF_KEY_CACHE: makeKv(),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ keys: [jwk] }),
    });

    const result = await verifyECDSA(bundle, env);

    expect(result.ok).toBe(true);
    expect(result.reason).toBe("ok");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(env.PROOF_KEY_CACHE.put).toHaveBeenCalledWith(
      `jwks:${jwk.kid}`,
      expect.any(String),
      expect.objectContaining({ expirationTtl: 21600 }),
    );
  });

  it("uses cached key by kid without fetching JWKS", async () => {
    const { bundle, jwk } = await buildSignedBundle();
    const env = {
      PROOF_KEY_CACHE: makeKv({ [`jwks:${jwk.kid}`]: JSON.stringify(jwk) }),
    };

    const key = await getPublicKeyByKid(jwk.kid, env);

    expect(key).toBeDefined();
    expect(env.PROOF_KEY_CACHE.get).toHaveBeenCalledWith(`jwks:${jwk.kid}`);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fails verification when signed_fields_hash does not match recomputation", async () => {
    const { bundle } = await buildSignedBundle();
    const env = {
      CHITTYCERT_JWKS_URL: "https://cert.chitty.cc/.well-known/jwks.json",
      PROOF_KEY_CACHE: makeKv(),
    };

    bundle.fact.fact_text = "Tampered text";

    const result = await verifyECDSA(bundle, env);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("signed_fields_hash_mismatch");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns unknown_kid when JWKS does not contain the signing key", async () => {
    const { bundle, jwk } = await buildSignedBundle();
    const env = {
      CHITTYCERT_JWKS_URL: "https://cert.chitty.cc/.well-known/jwks.json",
      PROOF_KEY_CACHE: makeKv(),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ keys: [{ ...jwk, kid: "some-other-kid" }] }),
    });

    const result = await verifyECDSA(bundle, env);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("unknown_kid");
  });
});
