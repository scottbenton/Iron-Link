import type { Datasworn } from "@datasworn-community/core";
import { useState } from "react";

import type { GameLogEntry } from "../../game/GameLog";
import type { InitiativeStatus } from "../../game/InitiativeChip";
import { getMoveRollOptions } from "../../game/MoveCard";
import type { MoveRollOption } from "../../game/MoveCard";
import type { RollData } from "../../game/RollCard";
import { character, legacyTracks, meterKeys } from "./playLayoutsShared";
import { rollAction } from "./rollDice";
import { characterAuthor, gameLogEntries } from "./sampleLog";

type MeterKey = (typeof meterKeys)[number] | "momentum";

/** Kira's sheet and the game's log, with rolls that land in the log. */
export function usePlaySheet() {
  const [meters, setMeters] = useState(character.meters);
  const [adds, setAdds] = useState(0);
  const [initiative, setInitiative] =
    useState<InitiativeStatus>("hasInitiative");
  const [impacts, setImpacts] = useState<Record<string, boolean>>({
    wounded: true,
  });
  const [xp, setXp] = useState(4);
  const [legacyTicks, setLegacyTicks] = useState<Record<string, number>>(() =>
    Object.fromEntries(legacyTracks.map((t) => [t.key, t.ticks])),
  );
  const [entries, setEntries] = useState<GameLogEntry[]>(gameLogEntries);
  const [recentRolls, setRecentRolls] = useState<
    { id: string; roll: RollData }[]
  >([]);

  const addRoll = (roll: RollData) => {
    const id = `roll-${Date.now()}-${Math.random()}`;
    setRecentRolls((current) => [{ id, roll }, ...current].slice(0, 3));
    setEntries((current) => [
      ...current,
      {
        kind: "roll",
        id,
        author: characterAuthor(character, true),
        timestamp: new Date(),
        roll,
      },
    ]);
  };

  /**
   * Rolls a stat or meter with the adds, which then reset to 0. Returns the
   * action die, so the die on the card that rolled lands on it.
   */
  const roll = (name: string, value: number, moveName?: string) => {
    const result = rollAction(name, value + adds, moveName, meters.momentum);
    addRoll({ ...result, statValue: value, adds: adds || undefined });
    setAdds(0);
    return result.actionDie;
  };

  const statValue = (key: string): number | undefined =>
    key in character.stats
      ? character.stats[key as keyof typeof character.stats]
      : key in meters
        ? meters[key as MeterKey]
        : undefined;

  return {
    meters,
    setMeter: (key: MeterKey, value: number) =>
      setMeters((current) => ({ ...current, [key]: value })),
    adds,
    setAdds,
    initiative,
    setInitiative,
    impacts,
    setImpact: (key: string, marked: boolean) =>
      setImpacts((current) => ({ ...current, [key]: marked })),
    xp,
    setXp,
    legacyTicks,
    setLegacyTicks: (key: string, ticks: number) =>
      setLegacyTicks((current) => ({ ...current, [key]: ticks })),
    entries,
    send: (message: string) =>
      setEntries((current) => [
        ...current,
        {
          kind: "message",
          id: `message-${current.length}`,
          author: characterAuthor(character, true),
          timestamp: new Date(),
          message,
        },
      ]),
    recentRolls,
    dismissRoll: (id: string) =>
      setRecentRolls((current) => current.filter((item) => item.id !== id)),
    roll,
    /** A move's roll buttons, with Kira's values. */
    moveRollOptions: (move: Datasworn.AnyMove): MoveRollOption[] =>
      getMoveRollOptions(move).map((option) => ({
        ...option,
        value: statValue(option.id),
      })),
  };
}

export type PlaySheet = ReturnType<typeof usePlaySheet>;
