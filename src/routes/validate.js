/**
 * Schema validation endpoint.
 *
 * POST /api/v1/validate — validate a bundle against FACT v2 schema.
 * Checks required fields, const values, and top-level structure.
 *
 * @canon chittycanon://core/services/chittyproof
 */

import { readFileSync } from "node:fs";

const schema = JSON.parse(
  readFileSync(
    new URL(
      "../../etc/authority/schema/chittyproof-v2-fact-bundle.schema.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

function validateRequired(obj, requiredFields, path) {
  const errors = [];
  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null) {
      errors.push({ field: path ? `${path}.${field}` : field, error: "required" });
    }
  }
  return errors;
}

function validateConst(obj, field, expected, path) {
  const fullPath = path ? `${path}.${field}` : field;
  if (obj[field] !== undefined && obj[field] !== expected) {
    return [{ field: fullPath, error: `must be "${expected}", got "${obj[field]}"` }];
  }
  return [];
}

export function validateRoutes(app) {
  app.post("/api/v1/validate", async (c) => {
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "bad_request", message: "invalid JSON" }, 400);
    }

    const { bundle } = body;
    if (!bundle || typeof bundle !== "object") {
      return c.json({ error: "bad_request", message: "bundle is required" }, 400);
    }

    const errors = [];

    // Top-level required fields
    errors.push(...validateRequired(bundle, schema.required, ""));

    // Const values
    errors.push(...validateConst(bundle, "proof_version", "2.0.0", ""));
    errors.push(...validateConst(bundle, "ruleset_id", "chittyproof-v2-fact-default", ""));

    // Nested required fields
    if (bundle.fact && typeof bundle.fact === "object") {
      errors.push(...validateRequired(bundle.fact, schema.properties.fact.required, "fact"));
      errors.push(...validateConst(bundle.fact, "status", "sealed", "fact"));
    }
    if (bundle.ledger && typeof bundle.ledger === "object") {
      errors.push(...validateRequired(bundle.ledger, schema.properties.ledger.required, "ledger"));
    }
    if (bundle.chain && typeof bundle.chain === "object") {
      errors.push(...validateRequired(bundle.chain, schema.properties.chain.required, "chain"));
    }
    if (bundle.score && typeof bundle.score === "object") {
      errors.push(...validateRequired(bundle.score, schema.properties.score.required, "score"));
    }
    if (bundle.pillars && typeof bundle.pillars === "object") {
      errors.push(
        ...validateRequired(bundle.pillars, schema.properties.pillars.required, "pillars"),
      );
    }

    return c.json({ valid: errors.length === 0, errors });
  });
}
