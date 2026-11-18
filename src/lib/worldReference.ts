import type { Datasworn } from "@datasworn-community/core";

import type { PlaysetConfig } from "repositories/game.repository";

import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import type { WorldOracleCatalog } from "./worldOracleCatalog";

export interface WorldReferenceRules {
  tree: Record<string, Datasworn.RulesPackage>;
  playset: PlaysetConfig;
}

// The rules a world's Reference sidebar browses: the packages of the world's
// effective playset, with every oracle no linked game includes excluded, so
// the sidebar offers what the world's fields can roll. Packages the catalog
// loaded only for stored bindings or "all packages" are left out.
export function getWorldReferenceRules(
  catalog: WorldOracleCatalog,
): WorldReferenceRules {
  const { effectivePlayset } = catalog;
  const tree = Object.fromEntries(
    Object.entries(catalog.tree).filter(([packageId]) =>
      effectivePlayset.packageIds.includes(packageId),
    ),
  );
  const oracles: Record<string, boolean> = {};
  catalog.choices.forEach((choice) => {
    if (
      tree[choice.packageId] &&
      !effectivePlayset.isOracleIncluded(choice.packageId, choice.id)
    ) {
      oracles[choice.id] = true;
    }
  });
  return {
    tree,
    playset: Object.keys(oracles).length > 0 ? { excludes: { oracles } } : {},
  };
}

export interface WorldBoundOracle {
  oracleId: string;
  // The fields that roll this oracle, in field order.
  fieldLabels: string[];
}

// The oracles a category's fields roll, in field order, each listed once with
// the labels of the fields that roll it. A rule's oracle counts with its
// field's. Guide-only fields count only for Guides, as only they see them.
export function getCategoryBoundOracles(
  fieldDefinitions: IWorldFieldDefinition[],
  categoryId: string,
  isGuide: boolean,
): WorldBoundOracle[] {
  const bound = new Map<string, WorldBoundOracle>();
  fieldDefinitions
    .filter(
      (field) => field.categoryId === categoryId && (isGuide || !field.gmOnly),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .forEach((field) => {
      [
        field.binding,
        ...field.configuration.rules.map((rule) => rule.binding),
      ].forEach((binding) => {
        if (!binding) return;
        const oracleId = binding.resolvedOracleId;
        const existing = bound.get(oracleId);
        if (!existing) {
          bound.set(oracleId, { oracleId, fieldLabels: [field.label] });
        } else if (!existing.fieldLabels.includes(field.label)) {
          existing.fieldLabels.push(field.label);
        }
      });
    });
  return [...bound.values()];
}

// The Reference column's width, as in a game.
export const WORLD_REFERENCE_WIDTH = 350;
// Below this much room for the world beside it, Reference collapses to a strip.
export const WORLD_PAGE_MIN_MAIN_WIDTH = 640;

export function getWorldReferencePlacement(
  pageWidth: number | undefined,
): "docked" | "strip" {
  return pageWidth === undefined ||
    pageWidth >= WORLD_PAGE_MIN_MAIN_WIDTH + WORLD_REFERENCE_WIDTH
    ? "docked"
    : "strip";
}
