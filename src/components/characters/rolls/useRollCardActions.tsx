import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import type { RollCardAction } from "ui/game/RollCard";
import { CopyIcon, DiceFiveIcon, FireIcon, TrashIcon } from "ui/icons";

import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import { useUID } from "stores/auth.store";
import { getCharacterAccess } from "stores/characterAccess";
import { GamePermission, useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

import { IGameLogRoll } from "services/gameLog.service";

import { canChangeRoll, getRollActionAvailability } from "./rollActions";
import { useOpenRollReroll } from "./rollRerollContext";
import { useRollActionRunner } from "./useRollActionRunner";

/**
 * The actions this person may take on a saved roll's card: Copy always,
 * Burn Momentum, Reroll and Delete where they apply, Reroll and Delete in
 * the card's ⋯ menu. A roll not saved to a game log has none.
 */
export function useRollCardActions(): (
  rollId: string | undefined,
  roll: IGameLogRoll,
) => RollCardAction[] {
  const { t } = useTranslation();
  const gameId = useGameIdOptional();
  const uid = useUID();
  const gamePermission = useGameStore((state) => state.gamePermissions);
  const characters = useGameCharactersStore((state) => state.characters);
  const runner = useRollActionRunner();
  const openReroll = useOpenRollReroll();

  return useCallback(
    (rollId, roll) => {
      if (!gameId || !rollId) return [];

      const character = roll.characterId
        ? characters[roll.characterId]
        : undefined;
      const canEditRollCharacter = getCharacterAccess({
        uid,
        ownerId: character?.uid,
        editPermissions: character?.editPermissions,
        gamePermission,
      }).canEdit;
      const available = getRollActionAvailability(roll, {
        canChangeRoll: canChangeRoll(roll, uid, canEditRollCharacter),
        canDeleteRolls: gamePermission === GamePermission.Guide,
        currentCharacterId: runner.currentCharacterId,
        momentum: runner.momentum,
      });

      const actions: RollCardAction[] = [
        {
          id: "copy",
          label: t("datasworn.roll-card.copy", "Copy"),
          icon: <CopyIcon />,
          onClick: () => runner.copy(roll),
        },
      ];
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
      return actions;
    },
    [t, gameId, uid, gamePermission, characters, runner, openReroll],
  );
}
