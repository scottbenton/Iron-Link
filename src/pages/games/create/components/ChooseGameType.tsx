import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Box, Card, CardActionArea, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { GameTypeIcon } from "assets/GameTypeIcon";

import { SectionHeading } from "components/SectionHeading";

import { useCreateGameStore } from "stores/createGame.store";

import { GameType } from "repositories/game.repository";

export function ChooseGameType() {
  const { t } = useTranslation();

  const gameType = useCreateGameStore((store) => store.gameType);
  const setGameType = useCreateGameStore((store) => store.setGameType);

  const labels: Record<GameType, string> = {
    [GameType.Solo]: t("game.type-solo", "Solo"),
    [GameType.Coop]: t("game.type-coop", "Co-op"),
    [GameType.Guided]: t("game.type-guided", "Guided"),
  };

  const descriptions: Record<GameType, string> = {
    [GameType.Solo]: t(
      "game.type.solo-description",
      "One player, playing one or more characters.",
    ),
    [GameType.Coop]: t(
      "game.type.coop-description",
      "Two or more players, all playing characters.",
    ),
    [GameType.Guided]: t(
      "game.type.guided-desciption",
      "One player takes the role of guide, with the rest playing characters.",
    ),
  };

  return (
    <Box>
      <SectionHeading
        breakContainer
        label={t("game.type.choose-game-type", "Choose Game Type")}
      />
      <Typography mt={1} color="text.secondary">
        {t(
          "game.type.guided-description",
          "How will you be playing your game? Game types help to streamline your experience.",
        )}
      </Typography>
      <Box
        mt={2}
        display="grid"
        gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))"
        gap={2}
      >
        {Object.values(GameType).map((type) => (
          <Card key={type} variant="outlined">
            <CardActionArea
              onClick={() => setGameType(type)}
              sx={{
                p: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                justifyContent: "flex-start",
              }}
            >
              <Box
                display="flex"
                alignItems="flex-start"
                justifyContent={"space-between"}
              >
                <Box display="flex" alignItems="center">
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    borderRadius={1}
                    p={1}
                    bgcolor="primary.main"
                    color="primary.contrastText"
                  >
                    <GameTypeIcon
                      sx={(theme) => ({
                        width: 32,
                        height: 32,
                        strokeWidth: 1,
                        overflow: "visible",
                        stroke: theme.palette.common.white,
                        color: theme.palette.common.white,
                      })}
                      gameType={type}
                    />
                  </Box>
                  <Typography
                    variant="h5"
                    textTransform="uppercase"
                    fontFamily={"fontFamilyTitle"}
                    ml={2}
                  >
                    {labels[type]}
                  </Typography>
                </Box>
                <Box width={24} height={24}>
                  {gameType === type && <CheckCircleIcon color="primary" />}
                </Box>
              </Box>
              <Typography mt={1} color="text.secondary">
                {descriptions[type]}
              </Typography>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
