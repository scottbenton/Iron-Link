import { useGamePermissions } from "@/hooks/usePermissions";
import { GameType } from "@/repositories/game.repository";
import { useGameCharactersStore } from "@/stores/gameCharacters.store";
import { Redirect } from "wouter";

export function HandleSoloGameRedirect() {
  const { gameType } = useGamePermissions();
  const characters = useGameCharactersStore((store) =>
    Object.values(store.characters),
  );

  if (gameType === GameType.Solo && characters.length === 1) {
    return <Redirect to={`/c/${characters[0].id}`} />;
  }
  return null;
}
