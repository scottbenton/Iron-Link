import { useCharacterId } from "@/hooks/useCharacterId";

export function CharacterTabContents() {
  const characterId = useCharacterId();

  return <>{characterId}</>;
}
