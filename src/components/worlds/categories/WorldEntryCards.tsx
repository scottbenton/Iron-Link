import { Box } from "@mui/material";

import { IWorldCategory } from "services/worldCategories.service";
import { IWorldEntry } from "services/worldEntries.service";

import type { WorldNavigation } from "../worldNavigation";
import { WorldCategoryEntryItem } from "./WorldCategoryEntryItem";

export interface WorldEntryCardRow {
  entry: IWorldEntry;
  subtitle?: string;
  // Holds other entries: drawn as a folder card that opens its Places.
  folder: boolean;
}

// Entries as cards, like a folder in Notes: folder cards first, then note
// cards, each in columns where there is room and one list where there is not.
export function WorldEntryCards({
  rows,
  category,
  guided,
  navigation,
  onDeleted,
  onError,
}: {
  rows: WorldEntryCardRow[];
  category: IWorldCategory;
  guided: boolean;
  navigation: Pick<WorldNavigation, "getLinkProps">;
  onDeleted: () => void;
  onError: (cause: unknown) => void;
}) {
  const folders = rows.filter((row) => row.folder);
  const notes = rows.filter((row) => !row.folder);
  const renderRow = ({ entry, subtitle, folder }: WorldEntryCardRow) => (
    <WorldCategoryEntryItem
      key={entry.id}
      entry={entry}
      category={category}
      subtitle={subtitle}
      guided={guided}
      folder={folder}
      onDeleted={onDeleted}
      onError={onError}
      linkProps={navigation.getLinkProps(
        folder
          ? {
              type: "entry",
              categoryId: category.id,
              entryId: entry.id,
              section: "places",
            }
          : { type: "entry", categoryId: category.id, entryId: entry.id },
      )}
    />
  );
  const list = (items: WorldEntryCardRow[], minWidth: number) => (
    <Box
      component="ul"
      sx={{
        listStyle: "none",
        p: 0,
        m: 0,
        display: "grid",
        gap: 1,
        gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
        "@container (max-width: 560px)": { gridTemplateColumns: "1fr" },
      }}
    >
      {items.map(renderRow)}
    </Box>
  );
  return (
    <Box
      sx={{
        containerType: "inline-size",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {folders.length > 0 && list(folders, 220)}
      {notes.length > 0 && list(notes, 280)}
    </Box>
  );
}
