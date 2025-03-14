import { useCharacterIdOptional } from "@/hooks/useCharacterId";

import { CharacterTabContents } from "../tabs/character";
import { GameOverviewTabContents } from "../tabs/game-overview";

export function OverviewTabContents() {
  const characterId = useCharacterIdOptional();

  if (characterId) {
    return <CharacterTabContents />;
  }

  return <GameOverviewTabContents />;
}
