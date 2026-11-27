import type { SvgIconComponent } from "@mui/icons-material";
import Groups2Icon from "@mui/icons-material/Groups2";
import MapIcon from "@mui/icons-material/Map";
import type { SvgIconProps } from "@mui/material";

import {
  GROUPS_CATEGORY_ICON_KEY,
  MAP_CATEGORY_ICON_KEY,
} from "./categoryIcons";

// The curated Material icons, by stored key. Each is imported on its own so
// the Material set is never bundled.
const MATERIAL_CATEGORY_ICON_COMPONENTS: Record<string, SvgIconComponent> = {
  [GROUPS_CATEGORY_ICON_KEY]: Groups2Icon,
  [MAP_CATEGORY_ICON_KEY]: MapIcon,
};

function getMaterialCategoryIcon(key: string): SvgIconComponent | undefined {
  return MATERIAL_CATEGORY_ICON_COMPONENTS[key];
}

// A curated Material icon at the size and colour its parent gives it.
export function MaterialCategoryIconGlyph({
  iconKey,
  ...props
}: SvgIconProps & { iconKey: string }) {
  const Icon = getMaterialCategoryIcon(iconKey);
  return Icon ? <Icon {...props} /> : null;
}
