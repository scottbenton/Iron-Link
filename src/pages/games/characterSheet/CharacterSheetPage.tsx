import { LinearProgress } from "@mui/material";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";

import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { CharacterSidebarContents } from "./components/CharacterSidebarContents";

export default function CharacterSheetPage() {
  const hasCharacter = useGameCharacter((character) => !!character);
  const error = useGameCharactersStore((state) => state.error);

  const { t } = useTranslation();

  if (!hasCharacter && !error) {
    return <LinearProgress />;
  }

  if (error) {
    return (
      <EmptyState
        message={t(
          "character.error-loading-character",
          "Error loading character",
        )}
      />
    );
  }

  return <CharacterSidebarContents />;
}
