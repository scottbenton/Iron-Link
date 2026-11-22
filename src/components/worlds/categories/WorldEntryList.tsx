import { Box } from "@mui/material";

import { IWorldCategory } from "services/worldCategories.service";
import { IWorldEntry } from "services/worldEntries.service";

import type { WorldNavigation } from "../worldNavigation";
import type { WorldEntryCardRow } from "./WorldEntryCards";
import { WorldEntryListRow } from "./WorldEntryListRow";

// Entries as one list of rows, like a file tree: in a category that nests,
// an entry holding others opens in place to show them. Which branches are
// open is remembered per category on this device.
export function WorldEntryList({
  rows,
  tree = {},
  subtitleOf,
  category,
  guided,
  navigation,
  onDeleted,
  onError,
}: {
  rows: Pick<WorldEntryCardRow, "entry" | "subtitle">[];
  // The entries inside each entry; leave out for a flat list.
  tree?: Record<string, IWorldEntry[]>;
  subtitleOf: (entry: IWorldEntry) => string | undefined;
  category: IWorldCategory;
  guided: boolean;
  navigation: Pick<WorldNavigation, "getLinkProps">;
  onDeleted: () => void;
  onError: (cause: unknown) => void;
}) {
  return (
    <Box
      component="ul"
      sx={{
        listStyle: "none",
        m: 0,
        py: 0.5,
        px: 0,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
      }}
    >
      {rows.map(({ entry, subtitle }) => (
        <WorldEntryListRow
          key={entry.id}
          entry={entry}
          subtitle={subtitle}
          depth={0}
          ancestorIds={[]}
          tree={tree}
          subtitleOf={subtitleOf}
          category={category}
          guided={guided}
          navigation={navigation}
          onDeleted={onDeleted}
          onError={onError}
        />
      ))}
    </Box>
  );
}
