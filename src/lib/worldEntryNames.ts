import { type WorldOracleLookup, rollWorldOracleText } from "./worldOracleRoll";

// A name built from oracle results joined together. Each part lists
// alternatives, one of which is rolled.
export interface WorldEntryNameGenerator {
  parts: string[][];
  joiner: string;
  expandLinks?: boolean;
}

const id = (path: string) => `oracle_rollable:${path}`;
const generator = (
  parts: string[][],
  joiner = " ",
  expandLinks = false,
): WorldEntryNameGenerator => ({
  parts: parts.map((alternatives) => alternatives.map(id)),
  joiner,
  expandLinks,
});

const PEOPLE = [
  generator([
    ["sundered_isles/character/name/given_name"],
    ["sundered_isles/character/name/family_name"],
  ]),
  generator([
    ["starforged/character/name/given_name"],
    ["starforged/character/name/family_name"],
  ]),
  generator([["classic/name/ironlander"]]),
  generator([["elegy/name/female", "elegy/name/male"]]),
];
const FACTIONS = [generator([["starforged/faction/name/template"]], " ", true)];
const SETTLEMENTS = [
  generator([["sundered_isles/settlement/name"]]),
  generator([["starforged/settlement/name"]]),
  generator(
    [
      ["classic/settlement/quick_name/prefix"],
      ["classic/settlement/quick_name/suffix"],
    ],
    "",
  ),
];

/**
 * The name rollers that suit an entry, chosen from its category's fields:
 * people (a Pronouns field), factions (a Faction Type field) and locations
 * (a Location Type field, by the entry's type). Rulesets are tried in order,
 * so a Sundered Isles world rolls its own names before Starforged's.
 */
function getCandidates(
  fieldKeys: ReadonlySet<string>,
  valueOf: (key: string) => string | undefined,
): WorldEntryNameGenerator[] {
  if (fieldKeys.has("pronouns")) return PEOPLE;
  if (fieldKeys.has("factionType")) return FACTIONS;
  if (!fieldKeys.has("locationType")) return [];
  const type = valueOf("locationType")?.toLowerCase() ?? "";
  if (type.includes("settlement")) return SETTLEMENTS;
  if (type === "sector") {
    return [
      generator([
        ["starforged/space/sector_name/prefix"],
        ["starforged/space/sector_name/suffix"],
      ]),
    ];
  }
  if (type === "planet") {
    // "Desert World" rolls the desert world names.
    const planetClass = valueOf("planetClass")?.split(" ")[0]?.toLowerCase();
    return planetClass
      ? [generator([[`starforged/planet/${planetClass}/name`]])]
      : [];
  }
  if (type === "island") {
    return [generator([["sundered_isles/island/name"]])];
  }
  if (type === "shipwreck") {
    return [generator([["sundered_isles/ship/name"]])];
  }
  return [];
}

export function getWorldEntryNameGenerator(
  fieldKeys: ReadonlySet<string>,
  valueOf: (key: string) => string | undefined,
  lookup: WorldOracleLookup,
): WorldEntryNameGenerator | undefined {
  return getCandidates(fieldKeys, valueOf).find((candidate) =>
    candidate.parts.every((alternatives) =>
      alternatives.some((oracleId) => lookup(oracleId)),
    ),
  );
}

export function rollWorldEntryName(
  nameGenerator: WorldEntryNameGenerator,
  lookup: WorldOracleLookup,
): string | undefined {
  const parts = nameGenerator.parts.map((alternatives) => {
    const available = alternatives.filter((oracleId) => lookup(oracleId));
    const oracleId = available[Math.floor(Math.random() * available.length)];
    return oracleId
      ? rollWorldOracleText(oracleId, lookup, {
          expandLinks: nameGenerator.expandLinks,
        })
      : undefined;
  });
  if (parts.some((part) => !part)) return undefined;
  return parts.join(nameGenerator.joiner);
}
