import { useTranslation } from "react-i18next";

import { uiSchemeNames } from "providers/ThemeProvider/uiSchemeNames";

import { CharacterInitiativeChip } from "components/characters/CharacterInitiativeChip";
import { CharacterPortraitAvatar } from "components/characters/CharacterPortraitAvatar";

import { Card } from "ui/components/Card";
import { Text } from "ui/components/Text";
import { FireIcon, HeartIcon } from "ui/icons";
import { HStack, Stack } from "ui/primitives";

import { ColorScheme } from "repositories/shared.types";

import { ICharacter } from "services/character.service";

import { SecondScreenMeterValue } from "./SecondScreenMeterValue";

/** A meter's value when the character has never changed it. */
const DEFAULT_METER_VALUE = 5;

interface SecondScreenCharacterCardProps {
  character: ICharacter;
  colorScheme: ColorScheme;
}

/**
 * One character on the second screen: portrait, name, initiative, and the
 * two meters the table watches. The card wears the character's colour
 * scheme. The Default scheme sets no attribute, so a Default character in a
 * game with its own scheme wears the game's (the library has no way to undo
 * an outer scheme).
 */
export function SecondScreenCharacterCard(
  props: SecondScreenCharacterCardProps,
) {
  const { character, colorScheme } = props;
  const { t } = useTranslation();

  const scheme = uiSchemeNames[colorScheme];

  return (
    <Card
      padding="sm"
      data-panda-theme={scheme === "default" ? undefined : scheme}
      css={{ borderTopWidth: "3px", borderTopColor: "accent.solid" }}
    >
      <HStack gap="3">
        <CharacterPortraitAvatar
          characterId={character.id}
          name={character.name}
          portraitSettings={character.profileImage ?? undefined}
          colorScheme={colorScheme}
          size="lg"
          decorative
        />
        <Stack gap="1" alignItems="flex-start" minWidth="0">
          <Text variant="h3" as="p">
            {character.name}
          </Text>
          <CharacterInitiativeChip status={character.initiativeStatus} />
        </Stack>
      </HStack>
      <HStack as="dl" gap="6" margin="0">
        <SecondScreenMeterValue
          icon={<HeartIcon weight="fill" aria-hidden />}
          tone="danger"
          label={t("second-screen.health", "Health")}
          value={character.conditionMeters["health"] ?? DEFAULT_METER_VALUE}
        />
        <SecondScreenMeterValue
          icon={<FireIcon weight="fill" aria-hidden />}
          tone="info"
          label={t("second-screen.spirit", "Spirit")}
          value={character.conditionMeters["spirit"] ?? DEFAULT_METER_VALUE}
        />
      </HStack>
    </Card>
  );
}
