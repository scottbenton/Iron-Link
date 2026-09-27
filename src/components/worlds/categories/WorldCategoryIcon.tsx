import CategoryOutlined from "@mui/icons-material/CategoryOutlined";
import { Box, SvgIcon } from "@mui/material";
import {
  blue,
  brown,
  green,
  grey,
  orange,
  pink,
  purple,
  red,
  yellow,
} from "@mui/material/colors";
import { useEffect, useState } from "react";
import type { IconType } from "react-icons";

import { IconColors, IconDefinition } from "types/Icon.type";

import { loadCategoryIcons } from "./categoryIcons";

const colors = {
  pink,
  red,
  orange,
  yellow,
  green,
  blue,
  purple,
  white: grey,
  grey,
  brown,
};

export function WorldCategoryIcon({ icon }: { icon: IconDefinition | null }) {
  const [icons, setIcons] = useState<Record<string, IconType>>();
  useEffect(() => {
    if (!icon?.key) return;
    let active = true;
    loadCategoryIcons()
      .then((loaded) => {
        if (active) setIcons(loaded);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [icon?.key]);
  if (!icon?.key) return null;
  const Icon = icon?.key ? icons?.[icon.key] : undefined;
  const color = colors[icon?.color ?? IconColors.Grey] ?? grey;
  return (
    <Box
      aria-hidden="true"
      sx={(theme) => ({
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        flexShrink: 0,
        borderRadius: 1,
        bgcolor: theme.palette.action.hover,
        color: color[theme.palette.mode === "dark" ? 200 : 800],
      })}
    >
      {Icon ? (
        <SvgIcon component={Icon} inheritViewBox fontSize="small" />
      ) : (
        <CategoryOutlined fontSize="small" />
      )}
    </Box>
  );
}
