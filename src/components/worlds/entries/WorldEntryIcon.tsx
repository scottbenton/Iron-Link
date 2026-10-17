import DescriptionIcon from "@mui/icons-material/Description";

import { IWorldEntry } from "services/worldEntries.service";

import {
  WorldCategoryIcon,
  type WorldCategoryIconSize,
} from "../categories/WorldCategoryIcon";

export function WorldEntryIcon({
  entry,
  size = "small",
}: {
  entry: Pick<IWorldEntry, "icon">;
  size?: WorldCategoryIconSize;
}) {
  return entry.icon?.key ? (
    <WorldCategoryIcon icon={entry.icon} size={size} />
  ) : (
    <DescriptionIcon
      sx={{ color: "primary.light" }}
      fontSize={size === "small" ? "medium" : "large"}
    />
  );
}
