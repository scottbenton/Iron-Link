import { Box, Divider, LinearProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { GridLayout } from "components/Layout";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import { useGameStore } from "stores/game.store";
import { useUsersWorldsFilteredByRole } from "stores/users.worlds.store";

import { CreateWorldInGame } from "./CreateWorldInGame";
import { WorldCard } from "./WorldCard";

export function WorldSelectionPage() {
  const { t } = useTranslation();

  const gameId = useGameId();
  const { worlds, loading, error } = useUsersWorldsFilteredByRole("owner");

  const setGameWorldId = useGameStore((store) => store.updateGameWorld);
  const handleWorldSelect = (worldId: string) => {
    setGameWorldId(gameId, worldId).catch((err) =>
      console.error(`Failed to select world: ${err}`),
    );
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box mt={2} px={2} pb={4}>
      {worlds.length > 0 && (
        <>
          <Typography
            variant="h6"
            mb={1}
            fontFamily={(theme) => theme.typography.fontFamilyTitle}
          >
            {t("game.worlds.use-existing", "Use an existing world")}
          </Typography>
          <GridLayout
            items={worlds}
            gap={1}
            renderItem={(world) => (
              <WorldCard
                key={world.id}
                world={world}
                onClick={() => handleWorldSelect(world.id)}
              />
            )}
            loading={loading}
            error={
              error
                ? t(
                    "world.list.error-loading-worlds",
                    "Failed to load worlds. Please try again later.",
                  )
                : undefined
            }
            minWidth={300}
          />
          <Divider sx={{ my: 4 }}>{t("common.or", "Or")}</Divider>
        </>
      )}
      <Typography
        variant="h6"
        fontFamily={(theme) => theme.typography.fontFamilyTitle}
        mb={1}
      >
        {t("game.worlds.create-new", "Create a new World")}
      </Typography>
      <CreateWorldInGame />
    </Box>
  );
}
