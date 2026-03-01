import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  canonicalize,
  canonicalSignedPayload,
  hashSignedPayload,
  normalizeBundle,
  roundN,
  verifyBundle,
} from "../../src/lib/chittyproof-v2-canonical.js";
import { makeFactProofBundle } from "../helpers/fact-proof-bundle.js";

describe("chittyproof-v2-canonical", () => {
  it("roundN uses deterministic half-up rounding", () => {
    expect(roundN(8.505, 2)).toBe(8.51);
    expect(roundN(7.7449, 2)).toBe(7.74);
    expect(roundN(0.12345, 4)).toBe(0.1235);
  });

  it("normalizes score and pillar numeric fields deterministically", () => {
    const bundle = makeFactProofBundle({
      score: {
        score_11: 8.505,
        score_adj_11: 7.7449,
        coverage: 0.82345,
        confidence: 0.91239,
      },
      pillars: {
        authority: {
          raw: 0.85155,
          score: 1.02124,
          weight: 1.20001,
          confidence: 0.92345,
        },
      },
    });

    const normalized = normalizeBundle(bundle);

    expect(normalized.score.score_11).toBe(8.51);
    expect(normalized.score.score_adj_11).toBe(7.74);
    expect(normalized.score.coverage).toBe(0.8235);
    expect(normalized.score.confidence).toBe(0.9124);
    expect(normalized.score.score_100).toBe(77);
    expect(normalized.pillars.authority.raw).toBe(0.8516);
    expect(normalized.pillars.authority.score).toBe(1.0212);
    expect(normalized.pillars.authority.weight).toBe(1.2);
    expect(normalized.pillars.authority.confidence).toBe(0.9235);
  });

  it("canonicalize sorts keys at every level", () => {
    expect(canonicalize({ b: 1, a: { z: true, y: false } })).toBe(
      '{"a":{"y":false,"z":true},"b":1}',
    );
  });

  it("canonicalSignedPayload excludes signature and artifacts and strips nulls", () => {
    const bundle = makeFactProofBundle({
      artifacts: {
        verification_url: "https://proof.chitty.cc/verify/proof-123",
        export_pdf_r2_key: null,
      },
    });

    const payload = canonicalSignedPayload(bundle);
    const parsed = JSON.parse(payload);
    expect(parsed.signature).toBeUndefined();
    expect(parsed.artifacts).toBeUndefined();
  });

  it("verifies signed_fields_hash consistency", async () => {
    const bundle = makeFactProofBundle();
    bundle.signature.signed_fields_hash = await hashSignedPayload(bundle);

    const okResult = await verifyBundle(bundle);
    expect(okResult.ok).toBe(true);

    bundle.signature.signed_fields_hash = `sha256:${"f".repeat(64)}`;
    const badResult = await verifyBundle(bundle);
    expect(badResult.ok).toBe(false);
  });

  it("ships strict FACT v2 schema with all 11 required pillars", () => {
    const schemaUrl = new URL(
      "../../etc/authority/schema/chittyproof-v2-fact-bundle.schema.json",
      import.meta.url,
    );
    const schema = JSON.parse(readFileSync(schemaUrl, "utf8"));

    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.required).toContain("pillars");
    expect(schema.properties.pillars.required).toHaveLength(11);
    expect(schema.properties.fact.properties.status.const).toBe("sealed");
  });
});
