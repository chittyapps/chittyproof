function deepMerge(base, overrides) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    return overrides === undefined ? base : overrides;
  }

  const out = structuredClone(base);
  for (const [key, value] of Object.entries(overrides)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      out[key] &&
      typeof out[key] === "object" &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMerge(out[key], value);
      continue;
    }
    out[key] = value;
  }
  return out;
}

function pillar(weight) {
  return {
    raw: 1,
    weight,
    score: weight,
    status: "pass",
    confidence: 1,
    evidence: [],
  };
}

export function makeFactProofBundle(overrides = {}) {
  const base = {
    proof_version: "2.0.0",
    ruleset_id: "chittyproof-v2-fact-default",
    weights_hash: `sha256:${"a".repeat(64)}`,
    proof_id: "proof-123",
    fact: {
      fact_id: "fact-1",
      fact_text: "The purchase price was $500,000.",
      created_at: "2026-03-01T00:00:00.000Z",
      status: "sealed",
      primary_evidence_id: "ev-1",
      fact_hash: `sha256:${"b".repeat(64)}`,
      evidence_hash_at_mint: `sha256:${"c".repeat(64)}`,
      corroborating_hashes: [
        {
          evidence_id: "ev-2",
          hash: `sha256:${"d".repeat(64)}`,
          validated_at: "2026-03-01T00:10:00.000Z",
        },
      ],
    },
    ledger: {
      ledger_fact_uri: "https://ledger.chitty.cc/api/facts/fact-1",
      sealed_by: "01-A-USA-1234-A-2601-A-X",
      sealed_at: "2026-03-01T00:20:00.000Z",
      seal_reason: "authority review complete",
    },
    chain: {
      anchored: true,
      anchor_status: "VERIFIED",
      blockchain_record_id: "123e4567-e89b-12d3-a456-426614174000",
      receipt: {
        type: "chittychain",
        payload: {},
      },
    },
    signature: {
      alg: "ECDSA-P256",
      kid: "proof-p256-2026-02-23-01",
      sig: "",
      sig_format: "raw_rs_64",
      signed_fields_hash: `sha256:${"0".repeat(64)}`,
    },
    score: {
      score_11: 8.5,
      score_100: 77,
      coverage: 0.82,
      confidence: 0.91,
      score_adj_11: 7.74,
      grade: "B",
      status: "STRONG",
      exceptions: [],
    },
    pillars: {
      hash_integrity: pillar(1.5),
      evidence_snapshot: pillar(1.1),
      corroboration: pillar(1.0),
      authority: pillar(1.2),
      seal_audit: pillar(0.8),
      lifecycle_validity: pillar(0.8),
      chronology: pillar(0.7),
      chain_anchor: pillar(1.2),
      signature_validity: pillar(1.0),
      dispute_posture: pillar(0.7),
      bundle_completeness: pillar(1.0),
    },
    artifacts: {
      verification_url: "https://proof.chitty.cc/verify/proof-123",
      export_pdf_r2_key: "exports/facts/fact-1/20260301-002000.pdf",
    },
    generated_at: "2026-03-01T00:20:30.000Z",
  };

  return deepMerge(base, overrides);
}
