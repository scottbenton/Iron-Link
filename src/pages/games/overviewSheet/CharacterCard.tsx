import OpenIcon from "@mui/icons-material/ChevronRight";
import { Box, Button, Card, CardActionArea, Typography } from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";
import { PortraitAvatar } from "components/characters/PortraitAvatar";

import { pathConfig } from "pages/pathConfig";

import { useSecondScreenFeature } from "hooks/advancedFeatures/useSecondScreenFeature";

import { useSecondScreenStore } from "stores/secondScreen.store";
import { useUserName } from "stores/users.store";

import { GameType } from "repositories/game.repository";
import { ColorScheme } from "repositories/shared.types";

import { ICharacter } from "services/character.service";

import { useGamePermissions } from "../gamePageLayout/hooks/usePermissions";

export interface CharacterCardProps {
  gameId: string;
  character: ICharacter;
}

export function CharacterCard(props: CharacterCardProps) {
  const { gameId, character } = props;
  const { t } = useTranslation();

  const playerName = useUserName(character.uid);
  const { gameType } = useGamePermissions();

  const isSecondScreenActive = useSecondScreenFeature();
  const isCharacterOpenOnSecondScreen = useSecondScreenStore(
    (store) =>
      store.settings?.type === "character" &&
      store.settings.characterId === character.id,
  );
  const openOnSecondScreen = useSecondScreenStore(
    (store) => store.updateSecondScreenSettings,
  );
  const id = character.id;
  const handleOpenOnSecondScreen = useCallback(() => {
    openOnSecondScreen(
      gameId,
      isCharacterOpenOnSecondScreen
        ? null
        : {
            type: "character",
            characterId: id,
          },
    ).catch(() => {});
  }, [isCharacterOpenOnSecondScreen, openOnSecondScreen, gameId, id]);

  return (
    <Card key={character.id} sx={{ mt: 1 }} variant="outlined">
      <CardActionArea
        LinkComponent={LinkComponent}
        href={pathConfig.gameCharacter(gameId, character.id)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 1,
          pr: 2,
        }}
      >
        <Box display={"flex"} alignItems={"center"}>
          <PortraitAvatar
            characterId={character.id}
            name={character.name}
            portraitSettings={character.profileImage ?? undefined}
            borderColor={character.colorScheme ?? ColorScheme.Default}
          />
          <Box ml={2}>
            <Typography variant="h5" fontFamily="fontFamilyTitle">
              {character.name}
            </Typography>
            {gameType !== GameType.Solo && (
              <Typography color="textSecondary" variant="body2">
                {playerName}
              </Typography>
            )}
          </Box>
        </Box>
        <OpenIcon sx={{ ml: 2 }} />
      </CardActionArea>

      {isSecondScreenActive && (
        <Button onClick={handleOpenOnSecondScreen}>
          {isCharacterOpenOnSecondScreen
            ? t("game.character.currently-open-on-second-screen", "On Screen")
            : t("game.character.open-on-second-screen", "Open on Screen")}
        </Button>
      )}
    </Card>
  );
}
