import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { SectionHeading } from "ui/layout";
import { Grid, Stack } from "ui/primitives";

import { useSpecialTrackRules } from "stores/dataswornTree.store";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { useCharacterId } from "../../hooks/useCharacterId";
import { SpecialTrack } from "./SpecialTrack";

// Starforged's legacy tracks, Ironsworn's bonds, Elegy's elegies: the
// character's special tracks.
export function LegacyTracks() {
  const { t } = useTranslation();
  const characterId = useCharacterId();
  const canEditCharacter = useCanEditCharacter();

  const values = useGameCharacter(
    (character) => character?.specialTracks ?? {},
  );
  const specialTrackRules = useSpecialTrackRules();
  const updateSpecialTrackValue = useGameCharactersStore(
    (store) => store.updateSpecialTrackValue,
  );

  const handleChange = useCallback(
    (key: string, value: number) => {
      if (characterId) {
        updateSpecialTrackValue(characterId, key, value).catch(() => {});
      }
    },
    [characterId, updateSpecialTrackValue],
  );

  const tracks = Object.entries(specialTrackRules);
  if (tracks.length === 0) return null;

  const isLegacy = (key: string) => key.endsWith("_legacy");
  const allLegacies = tracks.every(([key]) => isLegacy(key));

  return (
    <Stack gap="2" as="section">
      <SectionHeading
        title={
          allLegacies
            ? t("character.character-sidebar.legacy-tracks", "Legacy Tracks")
            : t("character.character-sidebar.special-tracks", "Special Tracks")
        }
        as="h3"
      />
      <Grid gap="2" gridTemplateColumns="repeat(auto-fill, minmax(260px, 1fr))">
        {tracks.map(([key, rule]) => (
          <SpecialTrack
            key={key}
            trackKey={key}
            label={rule.label}
            legacy={isLegacy(key)}
            ticks={values[key]?.value ?? 0}
            onChange={canEditCharacter ? handleChange : undefined}
          />
        ))}
      </Grid>
    </Stack>
  );
}
