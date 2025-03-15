import { DebouncedConditionMeter } from "@/components/datasworn/ConditonMeter";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useCharacterId } from "@/hooks/useCharacterId";
import { useIsOwnerOfCharacter } from "@/hooks/usePermissions";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "@/stores/gameCharacters.store";
import { useCallback } from "react";

export function CharacterAdds() {
  const t = useGameTranslations();
  const isCharacterOwner = useIsOwnerOfCharacter();

  const adds = useGameCharacter((store) => store?.adds ?? 0);
  const characterId = useCharacterId();
  const updateAdds = useGameCharactersStore(
    (store) => store.updateCharacterAdds,
  );

  const handleAddsChange = useCallback(
    (newAdds: number) => {
      updateAdds(characterId, newAdds).catch(() => {});
    },
    [characterId, updateAdds],
  );

  return (
    <DebouncedConditionMeter
      label={t("character.character-sidebar.adds", "Adds")}
      min={-9}
      max={9}
      defaultValue={0}
      disabled={!isCharacterOwner}
      value={adds}
      onChange={handleAddsChange}
    />
  );
}
