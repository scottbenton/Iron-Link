import { useParams } from "wouter";

export function useCharacterId() {
  const characterId = useCharacterIdOptional();
  if (!characterId) {
    throw new Error("Character ID is required");
  }
  return characterId;
}

export function useCharacterIdOptional() {
  const { characterId } = useParams<{ characterId?: string }>();
  return characterId;
}
