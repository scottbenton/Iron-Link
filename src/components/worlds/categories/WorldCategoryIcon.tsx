import CategoryOutlined from "@mui/icons-material/CategoryOutlined";
import { Box } from "@mui/material";
import { useEffect, useState } from "react";

import { IconDefinition } from "types/Icon.type";

import { GameIconGlyph } from "./GameIconGlyph";
import {
  getCategoryIconColor,
  getCategoryIconPaths,
  getLoadedCategoryIcons,
  isMaterialCategoryIconKey,
  loadCategoryIcons,
} from "./categoryIcons";
import { MaterialCategoryIconGlyph } from "./materialCategoryIcons";

export type WorldCategoryIconSize = "small" | "medium" | "large" | "xlarge";

// Theme-aware category icon. "small" renders the bare glyph for inline use
// (folder cards, lists); larger sizes sit on a tinted tile.
export function WorldCategoryIcon({
  icon,
  size = "medium",
}: {
  icon: IconDefinition | null;
  size?: WorldCategoryIconSize;
}) {
  const [icons, setIcons] = useState(getLoadedCategoryIcons);
  useEffect(() => {
    if (icons || !icon?.key || isMaterialCategoryIconKey(icon.key)) return;
    let active = true;
    loadCategoryIcons()
      .then((loaded) => {
        if (active) setIcons(loaded);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [icons, icon?.key]);
  if (!icon?.key) return null;
  const paths = getCategoryIconPaths(icons, icon.key);
  const box = { small: 24, medium: 30, large: 48, xlarge: 72 }[size];
  const glyph = { small: 20, medium: 20, large: 32, xlarge: 48 }[size];
  return (
    <Box
      aria-hidden="true"
      sx={(theme) => ({
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: box,
        height: box,
        flexShrink: 0,
        borderRadius: 1,
        bgcolor: size === "small" ? undefined : theme.palette.action.hover,
        color: getCategoryIconColor(icon.color, theme.palette.mode),
      })}
    >
      {isMaterialCategoryIconKey(icon.key) ? (
        <MaterialCategoryIconGlyph
          iconKey={icon.key}
          sx={{ fontSize: glyph }}
        />
      ) : paths ? (
        <GameIconGlyph paths={paths} sx={{ fontSize: glyph }} />
      ) : (
        <CategoryOutlined sx={{ fontSize: glyph }} />
      )}
    </Box>
  );
}
