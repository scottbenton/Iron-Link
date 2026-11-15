import { SvgIcon, SvgIconProps } from "@mui/material";

// An eraser, which Material icons does not have. The shape is the Material
// Design Icons "eraser" glyph (Apache 2.0).
export function WorldMapEraserIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-4.95-4.95-4.95 4.95z" />
    </SvgIcon>
  );
}
