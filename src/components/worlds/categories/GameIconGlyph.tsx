import { SvgIcon, SvgIconProps } from "@mui/material";

import { GameIconPaths } from "./categoryIcons";

// One Game Icon from the loaded set, drawn in the current text color.
export function GameIconGlyph({
  paths,
  ...props
}: { paths: GameIconPaths } & Omit<SvgIconProps, "children">) {
  return (
    <SvgIcon viewBox="0 0 512 512" {...props}>
      {paths.map((d, index) => (
        <path key={index} d={d} />
      ))}
    </SvgIcon>
  );
}
