import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { getOrderedPackageConfigs } from "data/package.config";

// Read release data directly from the shared template rows' initial values.
const migrations = resolve("supabase/migrations");
const catalogMigration = readdirSync(migrations)
  .filter((name) => name.endsWith("_world_template_defaults.sql"))
  .sort()
  .at(-1)!;
const catalogSource = readFileSync(`${migrations}/${catalogMigration}`, "utf8");
const catalog = JSON.parse(catalogSource.split("$templates$")[1]) as unknown;

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
