import { useTranslation } from "react-i18next";

import { TextField } from "ui/components/TextField";
import { SectionHeading } from "ui/layout";
import { Stack } from "ui/primitives";

import { useCreateGameStore } from "stores/createGame.store";

export function GameDetails() {
  const { t } = useTranslation();

  const gameName = useCreateGameStore((store) => store.gameName);
  const setGameName = useCreateGameStore((store) => store.setGameName);

  return (
    <Stack gap="4">
      <SectionHeading title={t("game.create.game-details", "Game Details")} />
      <TextField
        label={t("game.create.game-name", "Game Name")}
        value={gameName}
        onValueChange={setGameName}
        autoComplete="off"
        css={{ maxWidth: "400px" }}
      />
    </Stack>
  );
}
