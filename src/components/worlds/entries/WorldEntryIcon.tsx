import DescriptionIcon from "@mui/icons-material/Description";
import { Box } from "@mui/material";

import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { getLocationTypeIcon } from "lib/worldMap/locationTypeIcons";

import {
  IWorldEntry,
  WorldEntriesService,
} from "services/worldEntries.service";

import {
  WorldCategoryIcon,
  type WorldCategoryIconSize,
} from "../categories/WorldCategoryIcon";

const PORTRAIT_SIZE: Record<WorldCategoryIconSize, number> = {
  small: 24,
  medium: 30,
  large: 48,
  xlarge: 72,
};

// An entry's portrait if it has one, else its icon, else one for its
// Location Type, else its category's icon. Decorative: the entry's name
// always sits beside it.
export function WorldEntryIcon({
  entry,
  size = "small",
}: {
  entry: Pick<
    IWorldEntry,
    "id" | "worldId" | "categoryId" | "icon" | "imageFilename"
  >;
  size?: WorldCategoryIconSize;
}) {
  const categoryIcon = useWorldCategoriesStore(
    (store) => store.categories[entry.categoryId]?.icon ?? null,
  );
  const locationType = useWorldEntryLocationType(entry);
  if (entry.imageFilename) {
    const box = PORTRAIT_SIZE[size];
    return (
      <Box
        component="img"
        alt=""
        src={WorldEntriesService.getWorldEntryImageUrl(
          entry.worldId,
          entry.id,
          entry.imageFilename,
        )}
        sx={{
          width: box,
          height: box,
          flexShrink: 0,
          objectFit: "cover",
          borderRadius: 1,
        }}
      />
    );
  }
  const icon = entry.icon?.key
    ? entry.icon
    : (getLocationTypeIcon(locationType) ?? categoryIcon);
  return icon?.key ? (
    <WorldCategoryIcon icon={icon} size={size} />
  ) : (
    <DescriptionIcon
      sx={{ color: "primary.light" }}
      fontSize={size === "small" ? "medium" : "large"}
    />
  );
}

// The entry's Location Type, if its category has one. Map pins and the new
// place menu show the type's icon, so the entry shows it everywhere.
function useWorldEntryLocationType(
  entry: Pick<IWorldEntry, "id" | "categoryId">,
): string | undefined {
  const typeFieldIds = useWorldCategoriesStore((store) =>
    Object.values(store.fieldDefinitions)
      .filter(
        (field) =>
          field.categoryId === entry.categoryId && field.key === "locationType",
      )
      .map((field) => field.id)
      .join(" "),
  );
  return useWorldEntriesStore((store) => {
    if (!typeFieldIds) return undefined;
    const values = store.fieldValueState.valuesByEntry[entry.id];
    const value = typeFieldIds
      .split(" ")
      .map((id) => values?.[id]?.value)
      .find((found) => found);
    const type = Array.isArray(value) ? value[0] : value;
    return typeof type === "string" ? type : undefined;
  });
}
