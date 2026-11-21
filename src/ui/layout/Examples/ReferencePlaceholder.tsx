/**
 * Placeholder screens for the layout stories: enough of a character sheet,
 * the reference and the notes to show how the columns hold real content.
 * Story-only.
 */
import { Box, Stack } from "ui/primitives";

import { Text } from "../../components/Text";
import { sampleMoves } from "../../docs/fixtures/datasworn";
import { cardStyles } from "./storyPlaceholderStyles";

const moves = [
  sampleMoves.faceDanger,
  sampleMoves.gatherInformation,
  sampleMoves.strike,
  sampleMoves.payThePrice,
];

/** A short list of moves, standing in for the reference. */
export function ReferencePlaceholder() {
  return (
    <Stack gap="2" padding="4">
      {moves.map((move) => (
        <Box key={move._id ?? move.name} className={cardStyles}>
          <Text variant="label" as="p">
            {move.name}
          </Text>
          <Text variant="bodySm" color="muted">
            {move.trigger?.text}
          </Text>
        </Box>
      ))}
    </Stack>
  );
}
