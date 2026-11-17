import {
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  capitalize,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import {
  TOUCH_DEVICE_MEDIA_QUERY,
  TOUCH_TARGET_SIZE,
} from "hooks/useIsTouchDevice";

import {
  useDataswornTreeStore,
  useImpactRules,
} from "stores/dataswornTree.store";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { ironswornRulesetConfig } from "data/package.config";

import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { useCharacterId } from "../../hooks/useCharacterId";

/**
 * The character's impacts (Ironsworn's debilities) as checkboxes on the
 * sheet, two to a row, grouped by the rules' categories. Each row is a 44px
 * target on touch screens.
 */
export function ImpactsSection() {
  const characterId = useCharacterId();
  const canEditCharacter = useCanEditCharacter();

  const impacts = useGameCharacter((character) => character?.debilities ?? {});
  const { impactCategories } = useImpactRules();
  const updateImpactValue = useGameCharactersStore(
    (store) => store.updateCharacterImpactValue,
  );
  // Ironsworn calls its impacts debilities.
  const isIronsworn = useDataswornTreeStore(
    (store) => !!store.activeRules[ironswornRulesetConfig.id],
  );

  const { t } = useTranslation();

  const categories = Object.entries(impactCategories);
  const showCategoryLabels = categories.length > 1;

  return (
    <Box>
      <Typography
        variant="h6"
        component="h3"
        textTransform="uppercase"
        fontFamily="fontFamilyTitle"
      >
        {isIronsworn
          ? t("character.character-sidebar.debilities", "Debilities")
          : t("character.character-sidebar.impacts", "Impacts")}
      </Typography>
      {categories.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {t(
            "character.character-sidebar.no-impacts-found",
            "No impacts found",
          )}
        </Typography>
      )}
      <Box display="flex" flexDirection="column" gap={1}>
        {categories.map(([categoryKey, category]) => (
          <Box key={categoryKey}>
            {showCategoryLabels && (
              <Typography
                variant="body2"
                component="h4"
                color="text.secondary"
                fontWeight={600}
                textTransform="capitalize"
              >
                {category.label}
              </Typography>
            )}
            <Box display="grid" gridTemplateColumns="repeat(2, minmax(0, 1fr))">
              {Object.entries(category.contents).map(
                ([impactKey, impactRule]) => (
                  <FormControlLabel
                    key={impactKey}
                    disabled={!canEditCharacter}
                    sx={{
                      m: 0,
                      minHeight: 36,
                      gap: 0.5,
                      minWidth: 0,
                      [TOUCH_DEVICE_MEDIA_QUERY]: {
                        minHeight: TOUCH_TARGET_SIZE,
                      },
                    }}
                    control={
                      <Checkbox
                        size="small"
                        sx={{ p: 0.5 }}
                        checked={!!impacts[impactKey]}
                        onChange={(_, checked) => {
                          if (characterId) {
                            updateImpactValue(
                              characterId,
                              impactKey,
                              checked,
                            ).catch(() => {});
                          }
                        }}
                      />
                    }
                    label={capitalize(impactRule.label)}
                  />
                ),
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
