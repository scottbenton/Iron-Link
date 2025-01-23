import HealthIcon from "@mui/icons-material/Favorite";
import SpiritIcon from "@mui/icons-material/Whatshot";
import { Box, Card, ThemeProvider, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { getTheme } from "providers/ThemeProvider/themes/themeConfig";

import { PortraitAvatar } from "components/characters/PortraitAvatar";
import { InitiativeStatusChip } from "components/datasworn/InitiativeStatusChip";

import { useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

import { ColorScheme } from "repositories/shared.types";

export function CharacterSidebar() {
  const { t } = useTranslation();

  const gameColorScheme = useGameStore((store) => store.game?.colorScheme);

  const characters = useGameCharactersStore((store) =>
    Object.values(store.characters).sort((c1, c2) =>
      c1.name.localeCompare(c2.name),
    ),
  );

  return (
    <Box display="flex" flexDirection={"column"} gap={1} p={1}>
      <Typography
        fontFamily="fontFamilyTitle"
        variant="h6"
        color="textSecondary"
      >
        {t("second-screen.characters", "Characters")}
      </Typography>
      {characters.map((character) => (
        <ThemeProvider
          theme={getTheme(
            character.colorScheme ?? gameColorScheme ?? ColorScheme.Default,
          )}
        >
          <Card
            key={character.id}
            variant="outlined"
            sx={{
              bgcolor: "grey.900",
              borderColor: "primary.main",
              borderWidth: 3,
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              p={1}
              pr={2}
              bgcolor="background.paper"
            >
              <PortraitAvatar
                size="large"
                characterId={character.id}
                name={character.name}
                portraitSettings={character.profileImage ?? undefined}
                sx={{ borderWidth: 0 }}
              />
              <Box>
                <Typography
                  fontFamily="fontFamilyTitle"
                  variant="h4"
                  lineHeight={1.2}
                >
                  {character.name}
                </Typography>
                <InitiativeStatusChip status={character.initiativeStatus} />
              </Box>
            </Box>
            <Box
              bgcolor="grey.900"
              color="white"
              p={0.5}
              borderRadius={1}
              display="flex"
              gap={3}
              pl={14}
            >
              <Box display="flex" gap={0.5} alignItems={"center"}>
                <HealthIcon sx={{ color: "#ff6467" }} />
                <Typography fontFamily={"fontFamilyTitle"} variant="h5">
                  {character.conditionMeters["health"] ?? 5}
                </Typography>
              </Box>
              <Box display="flex" gap={0.5} alignItems={"center"}>
                <SpiritIcon sx={{ color: "#8ec5ff" }} />
                <Typography fontFamily={"fontFamilyTitle"} variant="h5">
                  {character.conditionMeters["spirit"] ?? 5}
                </Typography>
              </Box>
            </Box>
          </Card>{" "}
        </ThemeProvider>
      ))}
    </Box>
  );
}
