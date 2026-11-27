import { useTranslation } from "react-i18next";

import type { RollCardAction, RollData } from "ui/game/RollCard";
import { CopyIcon, DiceFiveIcon, FireIcon, TrashIcon } from "ui/icons";

import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import { getRollSummaryNames } from "hooks/useRollSummary";

import { useAppState } from "stores/appState.store";
import { useUID } from "stores/auth.store";
import { getCharacterAccess } from "stores/characterAccess";
import { GamePermission, useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

import { getRollTitle, toRollData } from "lib/rollSummary.lib";

import { IGameLogRoll } from "services/gameLog.service";

import { canChangeRoll, getRollActionAvailability } from "./rollActions";
import { useOpenRollReroll } from "./rollRerollContext";
import { useRollActionRunner } from "./useRollActionRunner";

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
 * person may take on it: Copy always, Burn Momentum, Reroll and Delete where
 * they apply (the same as the game log's), Reroll and Delete in the card's ⋯
 * menu. A roll not saved to a game log yet has none.
 */
export function useRecentRollCards(): RecentRollCard[] {
  const { t } = useTranslation();
  const rolls = useAppState((state) => state.visibleRolls);
  const gameId = useGameIdOptional();
  const uid = useUID();
  const gamePermission = useGameStore((state) => state.gamePermissions);
  const characters = useGameCharactersStore((state) => state.characters);
  const runner = useRollActionRunner();
  const openReroll = useOpenRollReroll();

  return rolls.map(({ id: rollId, roll }) => {
    const names = getRollSummaryNames(roll);
    const character = roll.characterId
      ? characters[roll.characterId]
      : undefined;
    const canEditRollCharacter = getCharacterAccess({
      uid,
      ownerId: character?.uid,
      editPermissions: character?.editPermissions,
      gamePermission,
    }).canEdit;

    const actions: RollCardAction[] = [];
    if (gameId && rollId) {
      const available = getRollActionAvailability(roll, {
        canChangeRoll: canChangeRoll(roll, uid, canEditRollCharacter),
        canDeleteRolls: gamePermission === GamePermission.Guide,
        currentCharacterId: runner.currentCharacterId,
        momentum: runner.momentum,
      });
      actions.push({
        id: "copy",
        label: t("datasworn.roll-card.copy", "Copy"),
        icon: <CopyIcon />,
        onClick: () => runner.copy(roll),
      });
      if (available.burnMomentum) {
        actions.push({
          id: "burn-momentum",
          label: t("datasworn.roll-card.burn-momentum", "Burn Momentum"),
          icon: <FireIcon />,
          onClick: () => runner.burnMomentum(rollId, roll),
        });
      }
      if (available.reroll && openReroll) {
        actions.push({
          id: "reroll",
          label: t("datasworn.roll-card.reroll", "Reroll"),
          icon: <DiceFiveIcon />,
          onClick: () => openReroll(rollId, roll),
          inMenu: true,
        });
      }
      if (available.delete) {
        actions.push({
          id: "delete",
          label: t("datasworn.roll-card.delete", "Delete"),
          icon: <TrashIcon />,
          onClick: () => runner.deleteRoll(rollId),
          inMenu: true,
          tone: "danger",
        });
      }
    }

    return {
      id: roll.id,
      rollId,
      logRoll: roll,
      roll: toRollData(roll, names),
      actions,
      dismissLabel: t("datasworn.roll-card.dismiss", "Dismiss {{rollName}}", {
        rollName: getRollTitle(roll, names),
      }),
    };
  });
}
