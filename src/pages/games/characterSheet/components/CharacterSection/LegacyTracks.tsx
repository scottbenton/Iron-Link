import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { DebouncedProgressTrack } from "components/datasworn/ProgressTrack";

import { useSpecialTrackRules } from "stores/dataswornTree.store";
import { doesTrackFollowLegacyRule } from "stores/dataswornTreeHelpers/specialTrackRules";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { useCharacterId } from "../../hooks/useCharacterId";
import { useIsOwnerOfCharacter } from "../../hooks/useIsOwnerOfCharacter";

export function LegacyTracks() {
  const { t } = useTranslation();

  const characterId = useCharacterId();
  const isCharacterOwner = useIsOwnerOfCharacter();

  const legacyTracks = useGameCharacter(
    (character) => character?.specialTracks ?? {},
  );
  const specialTrackRules = useSpecialTrackRules();
  const updateSpecialTrackValue = useGameCharactersStore(
    (store) => store.updateSpecialTrackValue,
  );
  const updateSpecialTrackIsLegacy = useGameCharactersStore(
    (store) => store.updateSpecialTrackIsLegacy,
  );

  const handleProgressTrackChange = useCallback(
    (key: string, value: number) => {
      if (characterId) {
        updateSpecialTrackValue(characterId, key, value).catch(() => {});
      }
    },
    [characterId, updateSpecialTrackValue],
  );

  const confirm = useConfirm();
  const handleIsLegacyChange = useCallback(
    (key: string, isLegacy: boolean) => {
      confirm({
        title: t("character.character-sidebar.mark-legacy", "Mark Legacy"),
        description: isLegacy
          ? t(
              "character.character-sidebar.mark-legacy-confirmation",
              "Are you sure you want to mark this track as completed? Your progress will be cleared, and progress rolls against this track will use a score of 10.",
            )
          : t(
              "character.character-sidebar.unmark-legacy-confirmation",
              "Are you sure you want to unmark this track as completed? Your progress will be cleared.",
            ),
        confirmationText: t("common.confirm", "Confirm"),
        confirmationButtonProps: {
          variant: "contained",
          color: "primary",
        },
      })
        .then(({ confirmed }) => {
          if (confirmed && characterId) {
            updateSpecialTrackIsLegacy(characterId, key, isLegacy).catch(
              () => {},
            );
          }
        })
        .catch(() => {});
    },
    [characterId, confirm, t, updateSpecialTrackIsLegacy],
  );

  return (
    <Box>
      <Typography
        variant="h6"
        textTransform="uppercase"
        fontFamily="fontFamilyTitle"
      >
        Legacy Tracks
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={2}>
        {Object.entries(specialTrackRules).map(([key, specialTrack]) => (
          <Box key={key} display="flex" alignItems="center">
            <DebouncedProgressTrack
              progressTrackKey={key}
              label={specialTrack.label}
              value={legacyTracks[key]?.value ?? 0}
              onChange={
                isCharacterOwner ? handleProgressTrackChange : undefined
              }
            />
            {doesTrackFollowLegacyRule(key) && (
              <FormControlLabel
                sx={{ ml: 0.5 }}
                control={
                  <Checkbox
                    checked={legacyTracks[key]?.isLegacy ?? false}
                    disabled={!isCharacterOwner}
                    onChange={(_, checked) =>
                      handleIsLegacyChange(key, checked)
                    }
                    inputProps={{
                      "aria-label": t(
                        "character.character-sidebar.mark-track-as-legacy",
                        "Mark {{label}} as a completed legacy. Progress rolls against completed legacies use a score of 10.",
                        { label: specialTrack.label },
                      ),
                    }}
                  />
                }
                label="10"
              />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
