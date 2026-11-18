import deepEqual from "fast-deep-equal";

import type {
  IWorldFieldDefinition,
  OracleBinding,
} from "types/worldField.type";

import {
  type LinkedGamePlayset,
  resolveOracleBinding,
} from "./effectivePlayset";

// What a world field rolls is stored with its binding (`resolvedOracleId`),
// and which oracle a binding resolves to follows the world's effective
// playset. Linking a game, unlinking one or changing a linked game's playset
// can therefore move a saved target. These helpers find the moves; the
// database applies them by compare-and-set (world_oracle_apply_changes).

// A binding a customized world stores: the field's own, or one of its rules'.
export interface WorldOracleBindingSlot {
  fieldId: string;
  // Null for the field's own binding.
  ruleIndex: number | null;
  binding: OracleBinding;
}

// A saved roll target that moves: from what the binding rolls today to what
// it resolves to under the new playsets.
export interface WorldOracleTargetChange {
  worldId: string;
  fieldId: string;
  ruleIndex: number | null;
  previousOracleId: string;
  nextOracleId: string;
}

// What the save dialog asks for each change: keep the oracle it rolls today
// (pinned exactly), or use the new one.
export type WorldOracleChangeChoice = "keep" | "useNew";

export function getWorldOracleBindingSlots(
  fields: Pick<IWorldFieldDefinition, "id" | "binding" | "configuration">[],
): WorldOracleBindingSlot[] {
  return fields.flatMap((field) => [
    ...(field.binding
      ? [{ fieldId: field.id, ruleIndex: null, binding: field.binding }]
      : []),
    ...field.configuration.rules.flatMap((rule, ruleIndex) =>
      rule.binding
        ? [{ fieldId: field.id, ruleIndex, binding: rule.binding }]
        : [],
    ),
  ]);
}

// Every saved target whose binding resolves differently under this
// replacement map. Exact bindings never move. Only customized worlds save
// targets: an inherited world's bindings follow the playsets by design.
export function getWorldOracleTargetChanges(
  worldId: string,
  configurationCustomized: boolean,
  fields: Pick<IWorldFieldDefinition, "id" | "binding" | "configuration">[],
  replacementMap: Record<string, string>,
): WorldOracleTargetChange[] {
  if (!configurationCustomized) return [];
  return getWorldOracleBindingSlots(fields).flatMap(
    ({ fieldId, ruleIndex, binding }) => {
      const nextOracleId = resolveOracleBinding(binding, replacementMap);
      return nextOracleId === binding.resolvedOracleId
        ? []
        : [
            {
              worldId,
              fieldId,
              ruleIndex,
              previousOracleId: binding.resolvedOracleId,
              nextOracleId,
            },
          ];
    },
  );
}

// The linked playsets read from the database carry no game ids, so a game is
// found by its rules. Removing one copy is right even when two games share
// the same rules: the other still counts.
export function withoutLinkedGame(
  games: LinkedGamePlayset[],
  game: LinkedGamePlayset,
): LinkedGamePlayset[] {
  const index = games.findIndex((candidate) => sameRules(candidate, game));
  return index === -1 ? games : games.filter((_, i) => i !== index);
}

export function withLinkedGame(
  games: LinkedGamePlayset[],
  game: LinkedGamePlayset,
): LinkedGamePlayset[] {
  return [...games, game];
}

function sameRules(a: LinkedGamePlayset, b: LinkedGamePlayset) {
  // Stored JSON reads back without the empty objects a client may send.
  return (
    deepEqual(a.rulesets ?? {}, b.rulesets ?? {}) &&
    deepEqual(a.expansions ?? {}, b.expansions ?? {}) &&
    deepEqual(a.playset ?? {}, b.playset ?? {})
  );
}

// The payload world_oracle_apply_changes reads, one per change.
export interface WorldOracleChangeInput {
  worldId: string;
  fieldId: string;
  ruleIndex: number | null;
  previousOracleId: string;
  nextOracleId: string;
  keep?: boolean;
}

export function getWorldOracleChangeInputs(
  changes: WorldOracleTargetChange[],
  choices: Record<string, WorldOracleChangeChoice>,
): WorldOracleChangeInput[] {
  return changes.map((change) => ({
    ...change,
    keep: choices[getWorldOracleChangeKey(change)] === "keep",
  }));
}

export function getWorldOracleChangeKey(
  change: Pick<WorldOracleTargetChange, "worldId" | "fieldId" | "ruleIndex">,
): string {
  return `${change.worldId}:${change.fieldId}:${change.ruleIndex ?? "field"}`;
}
