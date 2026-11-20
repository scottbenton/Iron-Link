/**
 * Placeholder screens for the layout stories: enough of a character sheet,
 * the reference and the notes to show how the columns hold real content.
 * Story-only.
 */
import { Stack } from "ui/primitives";

import { Text } from "../../components/Text";

/** A journal entry, standing in for the notes. */
export function NotesPlaceholder() {
  return (
    <Stack gap="3" padding="6" maxWidth="70ch">
      <Text variant="h3" as="p">
        Session 4: The Drowned Archive
      </Text>
      <Text>
        Kira and Orrin reached the archive at low tide. The lower stacks were
        already under water, and something had dragged the shelves into a
        barricade across the reading room.
      </Text>
      <Text>
        Orrin swore an iron vow to recover the starchart before the next flood.
        Kira is less sure it is still there: the salvager they met at the dock
        was carrying a tube of the same stamped leather.
      </Text>
      <Text>
        Open threads: who hired the salvager, why the archive keepers left, and
        what is moving under the water in the east wing.
      </Text>
    </Stack>
  );
}
