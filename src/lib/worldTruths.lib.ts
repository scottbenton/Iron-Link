import type { Datasworn } from "@datasworn-community/core";

// A world's choice for one truth, as stored. Exactly one of optionId and
// customDescription is set; subOptionId only with optionId.
export interface WorldTruthChoice {
  truthId: string;
  optionId: string | null;
  subOptionId: string | null;
  customDescription: string | null;
}

// The rules package a world's truths come from: the setting's own package,
// so the Sundered Isles shows its own truths rather than Starforged's.
export function getWorldTruthsPackageId(
  settingKey: string | null,
): string | null {
  if (!settingKey) return null;
  const packageId = settingKey.includes(":")
    ? settingKey.split(":")[1]?.split("/")[0]
    : settingKey;
  return packageId || null;
}

// The truths a package offers, in the book's order.
export function getPackageTruths(
  rulesPackage: Datasworn.RulesPackage | undefined,
): Datasworn.Truth[] {
  return Object.values(rulesPackage?.truths ?? {});
}

// A Starforged option's sub-table: the option's one oracle, if it has one.
export function getTruthOptionSubTable(
  option: Datasworn.TruthOption,
): TruthSubTable | undefined {
  return Object.values(option.oracles ?? {})[0] as TruthSubTable | undefined;
}

export interface TruthSubTable {
  _id: string;
  name: string;
  rows: Datasworn.OracleRollableRowText[];
}

export type ResolvedWorldTruth =
  | {
      kind: "option";
      option: Datasworn.TruthOption;
      optionIndex: number;
      subRow?: Datasworn.OracleRollableRowText;
    }
  | { kind: "custom"; description: string };

// What a stored choice means against the rules data loaded now. A choice
// whose option a rules update removed reads as not chosen (undefined); a
// sub-table row that's gone leaves the option chosen without it.
export function resolveWorldTruthChoice(
  truth: Datasworn.Truth,
  choice: WorldTruthChoice | undefined,
): ResolvedWorldTruth | undefined {
  if (!choice) return undefined;
  if (choice.optionId === null) {
    return { kind: "custom", description: choice.customDescription ?? "" };
  }
  const optionIndex = truth.options.findIndex(
    (option) => option._id === choice.optionId,
  );
  if (optionIndex < 0) return undefined;
  const option = truth.options[optionIndex];
  const subRow = choice.subOptionId
    ? getTruthOptionSubTable(option)?.rows.find(
        (row) => row._id === choice.subOptionId,
      )
    : undefined;
  return { kind: "option", option, optionIndex, subRow };
}

// How many of the setting's truths have a choice that still resolves.
export function countChosenTruths(
  truths: Datasworn.Truth[],
  choices: Record<string, WorldTruthChoice>,
): number {
  return truths.filter(
    (truth) => resolveWorldTruthChoice(truth, choices[truth._id]) !== undefined,
  ).length;
}

// ---------------------------------------------------------------------------
// Iron Fellowship and Crew Link truths
// ---------------------------------------------------------------------------

// A world's truths as Iron Fellowship and Crew Link stored them
// (`worlds/{id}.newTruths`, also in their export's world.json): keyed by the
// truth's key in its package's `truths` dictionary, with the option and
// sub-table row by index. An index of -1 is a truth the Guides wrote.
export interface LegacyWorldTruth {
  selectedTruthOptionIndex?: number;
  selectedSubItemIndex?: number | null;
  customTruth?: {
    description: string;
    questStarter: string;
  };
}

export const LEGACY_CUSTOM_TRUTH_INDEX = -1;

export type LegacyTruthProblem =
  // The setting has no truth by this key. A chosen option is dropped; a
  // written truth is kept under the id the truth would have.
  | "truthMissing"
  // The option index is past the truth's options; nothing is kept for it.
  | "optionMissing"
  // The option is kept, but its sub-table has no row at this index.
  | "subOptionMissing";

export interface LegacyTruthMapping {
  choices: WorldTruthChoice[];
  // Written quest starters, keyed by Datasworn truth id. Guide-only.
  questStarters: Record<string, string>;
  problems: { key: string; problem: LegacyTruthProblem }[];
}

// Maps Iron Fellowship and Crew Link truths onto the setting package's
// Datasworn truths (`truths`, its dictionary; Iron Fellowship read the same
// 0.3.0 data). Written truths always come across whole, even for a key the
// setting doesn't have, so nothing a Guide wrote is lost. Unpicked truths are
// skipped.
export function mapLegacyWorldTruths(
  legacyTruths: Record<string, LegacyWorldTruth> | undefined,
  packageId: string,
  truths: Record<string, Datasworn.Truth>,
): LegacyTruthMapping {
  const mapping: LegacyTruthMapping = {
    choices: [],
    questStarters: {},
    problems: [],
  };

  Object.entries(legacyTruths ?? {}).forEach(([key, legacy]) => {
    const index = legacy.selectedTruthOptionIndex;
    const custom = legacy.customTruth;
    const isCustom =
      index === LEGACY_CUSTOM_TRUTH_INDEX ||
      (index === undefined &&
        !!(custom?.description?.trim() || custom?.questStarter?.trim()));
    if (index === undefined && !isCustom) return;

    const truth = truths[key];
    if (!truth) mapping.problems.push({ key, problem: "truthMissing" });
    const truthId = truth?._id ?? `truth:${packageId}/${key}`;

    if (isCustom) {
      mapping.choices.push({
        truthId,
        optionId: null,
        subOptionId: null,
        customDescription: custom?.description ?? "",
      });
      if (custom?.questStarter?.trim()) {
        mapping.questStarters[truthId] = custom.questStarter;
      }
      return;
    }
    if (!truth) return;

    const option = index !== undefined ? truth.options[index] : undefined;
    if (!option) {
      mapping.problems.push({ key, problem: "optionMissing" });
      return;
    }

    let subOptionId: string | null = null;
    const subIndex = legacy.selectedSubItemIndex;
    if (subIndex !== undefined && subIndex !== null) {
      const row = getTruthOptionSubTable(option)?.rows[subIndex];
      if (row) subOptionId = row._id;
      else mapping.problems.push({ key, problem: "subOptionMissing" });
    }

    mapping.choices.push({
      truthId: truth._id,
      optionId: option._id,
      subOptionId,
      customDescription: null,
    });
  });

  return mapping;
}
