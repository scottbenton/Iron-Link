import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Card,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  IconButton,
  Typography,
  capitalize,
} from "@mui/material";
import { Button } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";
import { GridLayout } from "components/Layout";

import { useImpactRules } from "stores/dataswornTree.store";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { useCharacterId } from "../../hooks/useCharacterId";
import { useIsOwnerOfCharacter } from "../../hooks/useIsOwnerOfCharacter";

export function ImpactsSection() {
  const characterId = useCharacterId();
  const isCharacterOwner = useIsOwnerOfCharacter();

  const impacts = useGameCharacter((character) => character?.debilities ?? {});
  const { impactCategories, impacts: impactRules } = useImpactRules();
  const updateImpactValue = useGameCharactersStore(
    (store) => store.updateCharacterImpactValue,
  );

  const { t } = useTranslation();

  const activeImpactString: string =
    Object.entries(impacts)
      .filter(
        ([impactKey, impactValue]) => impactValue && impactRules[impactKey],
      )
      .map(([impactKey]) => impactRules[impactKey].label)
      .join(", ") || t("character.character-sidebar.no-impacts", "None");

  const [isImpactDialogOpen, setIsImpactDialogOpen] = useState(false);

  return (
    <Box>
      <Typography
        variant="h6"
        textTransform="uppercase"
        fontFamily="fontFamilyTitle"
      >
        {t("character.character-sidebar.impacts", "Impacts")}
      </Typography>
      <Card variant="outlined">
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ pl: 2, pr: 1 }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            {t("character.character-sidebar.active-impacts", "Active Impacts")}
          </Typography>
          {isCharacterOwner && (
            <IconButton
              aria-label={t(
                "character.character-sidebar.edit-impacts",
                "Edit Impacts",
              )}
              onClick={() => setIsImpactDialogOpen(true)}
            >
              <EditIcon />
            </IconButton>
          )}
        </Box>
        <Typography pb={2} px={2}>
          {capitalize(activeImpactString)}
        </Typography>
      </Card>
      <Dialog
        maxWidth="sm"
        fullWidth
        open={isImpactDialogOpen}
        onClose={() => setIsImpactDialogOpen(false)}
      >
        <DialogTitleWithCloseButton
          onClose={() => setIsImpactDialogOpen(false)}
        >
          {t("character.character-sidebar.edit-impacts", "Edit Impacts")}
        </DialogTitleWithCloseButton>
        <DialogContent>
          <GridLayout
            items={Object.entries(impactCategories)}
            renderItem={([categoryKey, category]) => (
              <Box key={categoryKey}>
                <Typography variant="h6" textTransform="capitalize">
                  {category.label}
                </Typography>
                <Box>
                  {Object.entries(category.contents).map(
                    ([impactKey, impactRule]) => (
                      <FormControlLabel
                        key={impactKey}
                        control={
                          <Checkbox
                            checked={impacts[impactKey]}
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
            )}
            emptyStateMessage={t(
              "character.character-sidebar.no-impacts-found",
              "No impacts found",
            )}
            minWidth={150}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant={"contained"}
            onClick={() => setIsImpactDialogOpen(false)}
          >
            {t("common.done", "Done")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
