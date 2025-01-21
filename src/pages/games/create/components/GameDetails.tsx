import { TextField } from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { SectionHeading } from "components/SectionHeading";

import { useCreateGameStore } from "stores/createGame.store";

export function GameDetails() {
  const { t } = useTranslation();

  const gameName = useCreateGameStore((store) => store.gameName);
  const setGameName = useCreateGameStore((store) => store.setGameName);

  const handleSetGameName = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setGameName(e.target.value);
    },
    [setGameName],
  );

  return (
    <>
      <SectionHeading
        label={t("game.create.game-details", "Game Details")}
        breakContainer
      />
      <TextField
        sx={{ mt: 2 }}
        label={t("game.create.game-name", "Game Name")}
        value={gameName}
        onChange={handleSetGameName}
      />
    </>
  );
}
