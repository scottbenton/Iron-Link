import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { getOrderedPackageConfigs } from "data/package.config";

// The generated snapshot of the migrated shared template rows; CI checks it
// matches the database (scripts/generate-world-defaults.mjs).
const catalog = JSON.parse(
  readFileSync(resolve("supabase/world-defaults.json"), "utf8"),
) as unknown;

function visitObjects(
  value: unknown,
  visit: (object: Record<string, unknown>) => void,
) {
  if (!value || typeof value !== "object") return;
  if (!Array.isArray(value)) visit(value as Record<string, unknown>);
  Object.values(value).forEach((child) => visitObjects(child, visit));
}

describe("canonical database catalog bindings", () => {
  it("targets installed Datasworn oracles with concrete initial selections", async () => {
    const oracleIds = new Set<string>();
    for (const config of getOrderedPackageConfigs()) {
      visitObjects(await config.load(), (object) => {
        if (
          typeof object._id === "string" &&
          object._id.startsWith("oracle_rollable:")
        ) {
          oracleIds.add(object._id);
        }
      });
    }
    const bindings: Record<string, unknown>[] = [];
    visitObjects(catalog, (object) => {
      if ("oracleId" in object) bindings.push(object);
    });
    expect(bindings.length).toBeGreaterThan(0);
    for (const binding of bindings) {
      expect(
        oracleIds.has(String(binding.oracleId)),
        String(binding.oracleId),
      ).toBe(true);
      expect(binding.resolvedOracleId).toBe(binding.oracleId);
      expect(binding.packageId).toBe(
        String(binding.oracleId).split(":")[1].split("/")[0],
      );
    }
  }, 30000);
});
