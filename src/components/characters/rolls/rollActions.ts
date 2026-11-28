import { RollResult, RollType } from "repositories/shared.types";

import { IGameLogRoll, IStatRoll } from "services/gameLog.service";

export interface RollActionContext {
  /** Whether this person may change the roll (reroll it, burn momentum). */
  canChangeRoll: boolean;
  /** Guides may delete any roll from the log. */
  canDeleteRolls: boolean;
  /** The character whose sheet is open, if any. */
  currentCharacterId: string | undefined;
  /** That character's momentum. */
  momentum: number;
}

/** Which of a roll's actions apply, beside Copy, which always does. */
export interface RollActionAvailability {
  reroll: boolean;
  burnMomentum: boolean;
  delete: boolean;
}

/**
 * Whether a roll can be changed: one made for a character by anyone who can
 * edit that character, otherwise only by the person who rolled it.
 */
export function canChangeRoll(
  roll: IGameLogRoll,
  uid: string | undefined,
  canEditRollCharacter: boolean,
): boolean {
  return roll.characterId ? canEditRollCharacter : roll.uid === uid;
}

/** The result a roll would have if its character burned this momentum. */
export function getBurnMomentumResult(
  roll: IStatRoll,
  momentum: number,
): RollResult {
  if (momentum > roll.challenge1 && momentum > roll.challenge2) {
    return RollResult.StrongHit;
  }
  if (momentum > roll.challenge1 || momentum > roll.challenge2) {
    return RollResult.WeakHit;
  }
  return RollResult.Miss;
}

/**
 * Burning momentum is offered only where it would improve the result: an
 * action roll not burned yet, made for the character whose sheet is open.
 */
export function isMomentumBurnUseful(
  roll: IGameLogRoll,
  momentum: number,
): boolean {
  if (roll.type !== RollType.Stat || roll.momentumBurned !== null) {
    return false;
  }
  const order = [RollResult.Miss, RollResult.WeakHit, RollResult.StrongHit];
  return (
    roll.result !== RollResult.StrongHit &&
    order.indexOf(getBurnMomentumResult(roll, momentum)) >
      order.indexOf(roll.result)
  );
}

export function getRollActionAvailability(
  roll: IGameLogRoll,
  context: RollActionContext,
): RollActionAvailability {
  const { canChangeRoll, canDeleteRolls, currentCharacterId, momentum } =
    context;
  const isStat = roll.type === RollType.Stat;
  return {
    reroll: isStat && canChangeRoll,
    burnMomentum:
      isStat &&
      canChangeRoll &&
      !!currentCharacterId &&
      roll.characterId === currentCharacterId &&
      isMomentumBurnUseful(roll, momentum),
    delete: canDeleteRolls,
  };
}
