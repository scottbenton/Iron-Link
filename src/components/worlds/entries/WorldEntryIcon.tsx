import DescriptionIcon from "@mui/icons-material/Description";
import { Box } from "@mui/material";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

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

// An entry's portrait if it has one, else its icon, else its category's
// icon. Decorative: the entry's name always sits beside it.
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
  const icon = entry.icon?.key ? entry.icon : categoryIcon;
  return icon?.key ? (
    <WorldCategoryIcon icon={icon} size={size} />
  ) : (
    <DescriptionIcon
      sx={{ color: "primary.light" }}
      fontSize={size === "small" ? "medium" : "large"}
    />
  );
}
