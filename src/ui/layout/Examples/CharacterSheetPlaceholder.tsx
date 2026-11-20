/**
 * Placeholder screens for the layout stories: enough of a character sheet,
 * the reference and the notes to show how the columns hold real content.
 * Story-only.
 */
import { Grid, HStack, Stack } from "ui/primitives";

import { Text } from "../../components/Text";
import { VisuallyHidden } from "../../components/VisuallyHidden";
import {
  SampleCharacter,
  sampleCharacters,
} from "../../docs/fixtures/characters";
import { cardStyles } from "./storyPlaceholderStyles";

const statNames = ["edge", "heart", "iron", "shadow", "wits"] as const;

const meterNames = ["health", "spirit", "supply", "momentum"] as const;

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

/** Stats and meters, standing in for the character sheet. */
export function CharacterSheetPlaceholder(props: {
  character?: SampleCharacter;
}) {
  const { character = sampleCharacters[0] } = props;
  return (
    <Stack gap="4" padding="4">
      <Stack gap="0.5">
        <Text variant="h3" as="p">
          {character.name}
        </Text>
        <Text variant="bodySm" color="muted">
          <VisuallyHidden>Played by </VisuallyHidden>
          {character.playerName}
        </Text>
      </Stack>
      <Grid gridTemplateColumns="repeat(5, minmax(0, 1fr))" gap="2">
        {statNames.map((stat) => (
          <Stack key={stat} gap="0" alignItems="center" className={cardStyles}>
            <Text variant="numeric" as="span">
              {character.stats[stat]}
            </Text>
            <Text variant="caption" color="muted">
              {capitalize(stat)}
            </Text>
          </Stack>
        ))}
      </Grid>
      <Stack gap="2">
        {meterNames.map((meter) => (
          <HStack
            key={meter}
            justifyContent="space-between"
            className={cardStyles}
          >
            <Text variant="label">{capitalize(meter)}</Text>
            <Text variant="numeric">
              {character.meters[meter] > 0 ? "+" : ""}
              {character.meters[meter]}
            </Text>
          </HStack>
        ))}
      </Stack>
    </Stack>
  );
}
