import type { Datasworn } from "@datasworn-community/core";

import type { WorldOracleCatalog } from "lib/worldOracleCatalog";

// An oracle whose rows each cover one face of a die with as many sides.
export function oracle(
  id: string,
  rows: (string | Partial<Datasworn.OracleRollableRow>)[],
): Datasworn.OracleRollable {
  return {
    _id: `oracle_rollable:${id}`,
    dice: `1d${rows.length}`,
    rows: rows.map((row, index) => ({
      roll: { min: index + 1, max: index + 1 },
      ...(typeof row === "string" ? { text: row } : row),
    })),
  } as unknown as Datasworn.OracleRollable;
}

export function catalogOf(
  ...oracles: Datasworn.OracleRollable[]
): WorldOracleCatalog {
  return {
    tree: {},
    effectivePlayset: {} as WorldOracleCatalog["effectivePlayset"],
    choices: oracles.map((item) => ({
      id: item._id,
      packageId: "starforged",
      packageName: "Starforged",
      label: item.name,
      oracle: item,
    })),
    replacementMap: {},
    collisions: {},
    missingPackageIds: [],
  };
}
