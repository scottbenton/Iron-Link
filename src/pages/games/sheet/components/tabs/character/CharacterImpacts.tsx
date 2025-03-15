import { Dialog } from "@/components/common/Dialog";
import { GridLayout } from "@/components/layout/GridLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogActionTrigger } from "@/components/ui/dialog";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useCharacterId } from "@/hooks/useCharacterId";
import { useIsOwnerOfCharacter } from "@/hooks/usePermissions";
import { useImpactRules } from "@/stores/dataswornTree.store";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "@/stores/gameCharacters.store";
import { Box, Button, Card, Heading, IconButton, Text } from "@chakra-ui/react";
import { EditIcon } from "lucide-react";

export function CharacterImpacts() {
  const t = useGameTranslations();
  const characterId = useCharacterId();
  const isCharacterOwner = useIsOwnerOfCharacter();

  const impacts = useGameCharacter((character) => character?.debilities ?? {});
  const { impactCategories, impacts: impactRules } = useImpactRules();
  const updateImpactValue = useGameCharactersStore(
    (store) => store.updateCharacterImpactValue,
  );

  const activeImpactString: string =
    Object.entries(impacts)
      .filter(
        ([impactKey, impactValue]) => impactValue && impactRules[impactKey],
      )
      .map(([impactKey]) => impactRules[impactKey].label)
      .join(", ") || t("character.character-sidebar.no-impacts", "None");

  return (
    <Box>
      <Heading size="xl" textTransform="uppercase">
        {t("impacts-section-heading", "Impacts")}
      </Heading>
      <Card.Root variant="outline" size="sm">
        <Card.Body>
          <Box
            display="flex"
            alignItems="flex-start"
            justifyContent="space-between"
          >
            <Text color="fg.muted">
              {t("impacts.active-impacts-label", "Active Impacts")}
            </Text>
            {isCharacterOwner && (
              <Dialog
                size="sm"
                trigger={
                  <IconButton
                    variant="ghost"
                    colorPalette="gray"
                    mt={-2}
                    mr={-2}
                    aria-label={t("edit-impacts", "Edit Impacts")}
                  >
                    <EditIcon />
                  </IconButton>
                }
                title={t("edit-impacts", "Edit Impacts")}
                content={
                  <GridLayout
                    items={Object.entries(impactCategories)}
                    renderItem={([categoryKey, category]) => (
                      <Box key={categoryKey}>
                        <Heading size="lg" textTransform="capitalize">
                          {category.label}
                        </Heading>
                        <Box display="flex" flexDir="column" gap={2}>
                          {Object.entries(category.contents).map(
                            ([impactKey, impactRule]) => (
                              <Checkbox
                                checked={impacts[impactKey] ?? false}
                                onCheckedChange={({ checked }) => {
                                  if (characterId) {
                                    updateImpactValue(
                                      characterId,
                                      impactKey,
                                      checked === true,
                                    ).catch(() => {});
                                  }
                                }}
                                textTransform={"capitalize"}
                              >
                                {impactRule.label}
                              </Checkbox>
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
                }
                actions={
                  <DialogActionTrigger asChild>
                    <Button>{t("common.done", "Done")}</Button>
                  </DialogActionTrigger>
                }
              />
            )}
          </Box>
          <Text textTransform={"capitalize"}>{activeImpactString}</Text>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
