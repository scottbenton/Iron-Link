import type { Datasworn } from "@datasworn-community/core";

import type { IWorldFieldDefinition } from "types/worldField.type";

import { rollDie } from "lib/rollDie";
import {
  type WorldOracleCatalog,
  getFrozenWorldOracleBinding,
} from "lib/worldOracleCatalog";

import type { WorldFieldValue } from "services/worldEntryFieldValues.service";

import { getWorldFieldKind } from "./worldFieldRules";

export type WorldOracleLookup = (
  oracleId: string,
) => Datasworn.OracleRollable | undefined;

// Rolls on the world page use the world's own oracle catalog, since no game
// has loaded its rules there.
export function createWorldOracleLookup(
  catalog: WorldOracleCatalog,
): WorldOracleLookup {
  const oracles = new Map(
    catalog.choices.map((choice) => [choice.id, choice.oracle]),
  );
  return (oracleId) => oracles.get(oracleId);
}

// One oracle roll as a game log shows it: the oracle's name, the die, and
// the plain result text the field or name received.
export interface WorldOracleRollRecord {
  oracleId: string;
  oracleName: string;
  roll: number;
  text: string;
}

export type WorldOracleRollListener = (record: WorldOracleRollRecord) => void;

const MAX_DEPTH = 4;
const DATASWORN_LINK = /\[([^\]]*)\]\((datasworn:[^)]*)\)/g;

/**
 * Rolls an oracle and returns its result as plain text. Results that roll
 * other oracles join those results with commas. With expandLinks, links to
 * other oracles in a result are rolled in place, as the Starforged faction
 * name templates expect; otherwise a link reads as its label. onRoll hears
 * the outermost roll once it has a result.
 */
export function rollWorldOracleText(
  oracleId: string,
  lookup: WorldOracleLookup,
  options: { expandLinks?: boolean; onRoll?: WorldOracleRollListener } = {},
  depth = 0,
): string | undefined {
  const { onRoll, ...nested } = options;
  const rolled = rollOracleRow(oracleId, lookup, nested, depth);
  if (rolled === undefined) return undefined;
  if (depth === 0) onRoll?.({ oracleId, ...rolled });
  return rolled.text;
}

function rollOracleRow(
  oracleId: string,
  lookup: WorldOracleLookup,
  options: { expandLinks?: boolean },
  depth: number,
): { text: string; roll: number; oracleName: string } | undefined {
  const oracle = lookup(oracleId);
  if (!oracle || depth > MAX_DEPTH || !("rows" in oracle)) return undefined;
  const roll = rollDie(oracle.dice);
  if (roll === undefined) return undefined;
  const row = oracle.rows.find(
    (candidate) =>
      candidate.roll &&
      candidate.roll.min <= roll &&
      candidate.roll.max >= roll,
  );
  if (!row) return undefined;

  const autoRolls = (row.oracle_rolls ?? []).filter((roll) => roll.auto);
  if (autoRolls.length) {
    const results: string[] = [];
    for (const subRoll of autoRolls) {
      for (let i = 0; i < subRoll.number_of_rolls; i++) {
        const result = rollWorldOracleText(
          subRoll.oracle ?? oracleId,
          lookup,
          options,
          depth + 1,
        );
        if (result) results.push(result);
      }
    }
    if (results.length)
      return { text: results.join(", "), roll, oracleName: oracle.name };
  }

  const text = options.expandLinks
    ? row.text.replace(DATASWORN_LINK, (_link, label: string, uri: string) => {
        const linked = uri.replace(/^datasworn:/, "");
        return rollWorldOracleText(linked, lookup, options, depth + 1) ?? label;
      })
    : row.text;
  return { text: toPlainText(text), roll, oracleName: oracle.name };
}

// Oracle text is Markdown; a field holds one plain line.
function toPlainText(text: string) {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/\s*\n+\s*/g, " ")
    .trim();
}

/**
 * The oracle a field rolls, if it has one this world can roll: its effective
 * binding must point at an oracle in the catalog. Only Text fields and
 * option lists roll.
 */
export function getWorldFieldRollTarget(
  field: Pick<IWorldFieldDefinition, "type" | "configuration" | "binding">,
  catalog: WorldOracleCatalog | null,
): string | undefined {
  if (!catalog || !field.binding) return undefined;
  const kind = getWorldFieldKind(field);
  if (kind !== "text" && kind !== "optionList") return undefined;
  const frozen = getFrozenWorldOracleBinding(field.binding, catalog);
  return frozen.missing || !frozen.oracle ? undefined : frozen.oracleId;
}

const OPTION_ATTEMPTS = 10;

/**
 * Rolls a value for a field: the result text for Text, or the matching
 * option for an option list. A strict list rerolls a few times when the
 * result is not one of its options, then gives up. A list that takes several
 * values gains the rolled one. onRoll hears only the roll that was kept.
 */
export function rollWorldFieldValue(
  field: Pick<IWorldFieldDefinition, "type" | "configuration" | "binding">,
  current: WorldFieldValue | null | undefined,
  catalog: WorldOracleCatalog | null,
  lookup: WorldOracleLookup,
  onRoll?: WorldOracleRollListener,
): WorldFieldValue | undefined {
  const oracleId = getWorldFieldRollTarget(field, catalog);
  if (!oracleId) return undefined;
  if (getWorldFieldKind(field) === "text") {
    return rollWorldOracleText(oracleId, lookup, { onRoll });
  }
  const { suggestions, allowOther, multiple } = field.configuration;
  for (let attempt = 0; attempt < OPTION_ATTEMPTS; attempt++) {
    let record: WorldOracleRollRecord | undefined;
    const text = rollWorldOracleText(oracleId, lookup, {
      onRoll: (rolled) => (record = rolled),
    });
    if (!text) continue;
    const option =
      suggestions.find(
        (candidate) => candidate.toLowerCase() === text.toLowerCase(),
      ) ?? (allowOther ? text : undefined);
    if (!option) continue;
    if (record) onRoll?.({ ...record, text: option });
    if (!multiple) return option;
    const values = Array.isArray(current) ? current : current ? [current] : [];
    return values.includes(option) ? values : [...values, option];
  }
  return undefined;
}
