import { useTranslation } from "react-i18next";

import { RadioCard, RadioCardGroup } from "ui/components/RadioCard";
import {
  CoopGameIcon,
  GuidedGameIcon,
  Icon,
  PhosphorIcon,
  SoloGameIcon,
} from "ui/icons";
import { SectionHeading } from "ui/layout";
import { Stack } from "ui/primitives";

import { useCreateGameStore } from "stores/createGame.store";

import { GameType } from "repositories/game.repository";

const gameTypeIcons: Record<GameType, PhosphorIcon> = {
  [GameType.Solo]: SoloGameIcon,
  [GameType.Coop]: CoopGameIcon,
  [GameType.Guided]: GuidedGameIcon,
};

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
      "game.type.guided-description",
      "One player takes the role of guide, with the rest playing characters.",
    ),
  };

  const heading = t("game.type.choose-game-type", "Choose Game Type");

  return (
    <Stack gap="4">
      <SectionHeading
        title={heading}
        description={t(
          "game.type.choose-game-type-description",
          "How will you be playing your game? Game types help to streamline your experience.",
        )}
      />
      <RadioCardGroup<GameType>
        label={heading}
        hideLabel
        value={gameType}
        onValueChange={setGameType}
        minCardWidth="200px"
      >
        {Object.values(GameType).map((type) => (
          <RadioCard<GameType>
            key={type}
            value={type}
            icon={<Icon icon={gameTypeIcons[type]} size="lg" />}
            title={labels[type]}
            description={descriptions[type]}
          />
        ))}
      </RadioCardGroup>
    </Stack>
  );
}
