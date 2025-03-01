import { GameTypeIcon } from "@/assets/GameTypeIcon";
import {
  RadioCardItem,
  RadioCardLabel,
  RadioCardRoot,
} from "@/components/ui/radio-card";
import { useGameCreateTranslations } from "@/hooks/i18n/useGameCreateTranslations";
import { GameType } from "@/repositories/game.repository";
import { useCreateGameStore } from "@/stores/createGame.store";
import { Box } from "@chakra-ui/react";

export function ChooseGameType() {
  const t = useGameCreateTranslations();

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
      <RadioCardRoot
        value={gameType}
        onValueChange={(evt) => setGameType(evt.value as GameType)}
      >
        <RadioCardLabel>
          {t(
            "game.type.guided-description",
            "How will you be playing your game? Game types help to streamline your experience.",
          )}
        </RadioCardLabel>
        <Box
          display="grid"
          gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))"
          gap={2}
          mt={2}
        >
          {Object.values(GameType).map((type) => (
            <RadioCardItem
              icon={<GameTypeIcon gameType={type} size="xl" color="fg.muted" />}
              key={type}
              label={labels[type]}
              description={descriptions[type]}
              value={type}
              cursor="pointer"
            />
          ))}
        </Box>
      </RadioCardRoot>
    </Box>
  );
}
