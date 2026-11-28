import { useTranslation } from "react-i18next";

import type { RollCardAction, RollData } from "ui/game/RollCard";

import { getRollSummaryNames } from "hooks/useRollSummary";

import { useAppState } from "stores/appState.store";

import { getRollTitle, toRollData } from "lib/rollSummary.lib";

import { IGameLogRoll } from "services/gameLog.service";

import { useRollCardActions } from "./useRollCardActions";

export interface RecentRollCard {
  /** The card's key: the roll's own id, saved or not. */
  id: string;
  /** The roll's log id, once it is saved. */
  rollId: string | undefined;
  logRoll: IGameLogRoll;
  roll: RollData;
  actions: RollCardAction[];
  dismissLabel: string;
}

/**
 * The cards of the last few rolls, oldest first, each with the actions this
 * person may take on it (`useRollCardActions`, the same as the game log's).
 */
export function useRecentRollCards(): RecentRollCard[] {
  const { t } = useTranslation();
  const rolls = useAppState((state) => state.visibleRolls);
  const getActions = useRollCardActions();

  return rolls.map(({ id: rollId, roll }) => {
    const names = getRollSummaryNames(roll);
    return {
      id: roll.id,
      rollId,
      logRoll: roll,
      roll: toRollData(roll, names),
      actions: getActions(rollId, roll),
      dismissLabel: t("datasworn.roll-card.dismiss", "Dismiss {{rollName}}", {
        rollName: getRollTitle(roll, names),
      }),
    };
  });
}
