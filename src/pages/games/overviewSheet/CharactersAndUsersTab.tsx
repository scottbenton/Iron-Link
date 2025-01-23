import { Button, Typography } from "@mui/material";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { LinkComponent } from "components/LinkComponent";

import { pathConfig } from "pages/pathConfig";

import { GamePermission, useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

import { GameType } from "repositories/game.repository";

import { GamePlayerRole } from "services/game.service";

import { useGameId } from "../gamePageLayout/hooks/useGameId";
import { useGamePermissions } from "../gamePageLayout/hooks/usePermissions";
import { CharacterCard } from "./CharacterCard";
import { UserCard } from "./UserCard";

export function CharactersAndUsersTab() {
  const gameId = useGameId();

  const characters = useGameCharactersStore((state) =>
    Object.values(state.characters),
  );

  const users = useGameStore((store) => store.gamePlayers ?? {});

  const { t } = useTranslation();

  const { gameType, gamePermission } = useGamePermissions();
  const areAnyPlayersGuides = useMemo(() => {
    return Object.values(users).some(
      (user) => user.role === GamePlayerRole.Guide,
    );
  }, [users]);

  const { success } = useSnackbar();
  const handleCopy = useCallback(() => {
    const inviteLink = location.origin + `/games/${gameId}/join`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      success("Copied URL to clipboard");
    });
  }, [gameId, success]);

  return (
    <>
      <Typography variant={"h6"} fontFamily={"fontFamilyTitle"} mt={2}>
        {t("game.overview.characters", "Characters")}
      </Typography>
      {characters.map((character) => (
        <CharacterCard
          key={character.id}
          gameId={gameId}
          character={character}
        />
      ))}
      {gamePermission !== GamePermission.Viewer && (
        <Button
          LinkComponent={LinkComponent}
          href={pathConfig.gameCharacterCreate(gameId)}
          sx={{ mt: 1 }}
          variant="outlined"
          color="inherit"
        >
          {t("game.overview.add-character", "Add Character")}
        </Button>
      )}

      {gameType !== GameType.Solo && (
        <>
          <Typography variant={"h6"} fontFamily={"fontFamilyTitle"} mt={2}>
            {t("game.overview.players", "Players")}
          </Typography>
          {Object.entries(users).map(([userId, user]) => (
            <UserCard
              key={userId}
              gameId={gameId}
              uid={userId}
              role={user.role}
              gamePermission={gamePermission}
              gameType={gameType}
              areAnyPlayersGuides={areAnyPlayersGuides}
            />
          ))}
          {gamePermission !== GamePermission.Viewer && (
            <Button
              variant="outlined"
              color="inherit"
              sx={{ mt: 1 }}
              onClick={handleCopy}
            >
              {t("game.overview.invite", "Copy Invite Link")}
            </Button>
          )}
        </>
      )}
    </>
  );
}
