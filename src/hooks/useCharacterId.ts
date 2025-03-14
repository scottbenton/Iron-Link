import { useCallback } from "react";
import { useSearchParams } from "wouter";

export function useCharacterId() {
  const characterId = useCharacterIdOptional();
  if (!characterId) {
    throw new Error("Character ID is required");
  }
  return characterId;
}

export function useCharacterIdOptional() {
  const [searchParams] = useSearchParams();
  const characterId = searchParams.get("c");
  return characterId ?? undefined;
}

export function useSetCharacterId() {
  const [, setSearchParams] = useSearchParams();
  return useCallback(
    (characterId: string | null) => {
      setSearchParams((prev) => {
        if (characterId === null) {
          prev.delete("c");
        } else {
          prev.set("c", characterId);
        }
        return prev;
      });
    },
    [setSearchParams],
  );
}
