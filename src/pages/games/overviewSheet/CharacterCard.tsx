import { useTranslation } from "react-i18next";

import { uiSchemeNames } from "providers/ThemeProvider/uiSchemeNames";

import { LinkComponent } from "components/LinkComponent";

import { Button } from "ui/components/Button";
import { CharacterCard as CharacterCardView } from "ui/game/CharacterCard";
import { MonitorArrowUpIcon } from "ui/icons";

import { pathConfig } from "pages/pathConfig";

import { useSecondScreenFeature } from "hooks/advancedFeatures/useSecondScreenFeature";

import {
  useCharacterPortrait,
  useLoadCharacterPortrait,
} from "stores/character.store";
import { useSecondScreenStore } from "stores/secondScreen.store";
import { useUserName } from "stores/users.store";

import { GameType } from "repositories/game.repository";

import { ICharacter } from "services/character.service";

import { useGamePermissions } from "../gamePageLayout/hooks/usePermissions";

export interface CharacterCardProps {
  gameId: string;
  character: ICharacter;
}

/**
 * A character on the game overview: opens its sheet, and puts it on the
 * second screen where that feature is on.
 */
export function CharacterCard(props: CharacterCardProps) {
  const { gameId, character } = props;
  const { t } = useTranslation();

  const playerName = useUserName(character.uid);
  const { gameType } = useGamePermissions();

  const portraitSettings = character.profileImage ?? undefined;
  useLoadCharacterPortrait(character.id, portraitSettings?.filename);
  const portraitUrl = useCharacterPortrait(character.id).url;

  const isSecondScreenActive = useSecondScreenFeature();
  const isOnSecondScreen = useSecondScreenStore(
    (store) =>
      store.settings?.type === "character" &&
      store.settings.characterId === character.id,
  );
  const updateSecondScreen = useSecondScreenStore(
    (store) => store.updateSecondScreenSettings,
  );
  const toggleSecondScreen = () => {
    updateSecondScreen(
      gameId,
      isOnSecondScreen
        ? null
        : { type: "character", characterId: character.id },
    ).catch(() => {});
  };

  return (
    <CharacterCardView
      name={character.name}
      playerName={gameType !== GameType.Solo ? playerName : undefined}
      portraitUrl={portraitSettings ? portraitUrl : undefined}
      portraitCrop={
        portraitSettings
          ? {
              position: portraitSettings.position,
              scale: portraitSettings.scale,
            }
          : undefined
      }
      colorScheme={
        character.colorScheme ? uiSchemeNames[character.colorScheme] : undefined
      }
      headingAs="h4"
      render={
        <LinkComponent href={pathConfig.gameCharacter(gameId, character.id)} />
      }
      actions={
        isSecondScreenActive && (
          <Button
            size="sm"
            variant="ghost"
            startIcon={<MonitorArrowUpIcon />}
            onClick={toggleSecondScreen}
          >
            {isOnSecondScreen
              ? t("game.character.currently-open-on-second-screen", "On Screen")
              : t("game.character.open-on-second-screen", "Open on Screen")}
          </Button>
        )
      }
    />
  );
}
