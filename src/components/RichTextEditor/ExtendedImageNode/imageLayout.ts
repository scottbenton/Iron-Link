import { Alignment, TextWrapping } from "./RichImageNodeAttributes";

export interface NoteImageLayout {
  alignment: Alignment;
  textWrapping: TextWrapping;
}

/**
 * The image's alignment and wrapping, falling back to left and breaking the
 * text for values this build doesn't know.
 */
export function getNoteImageLayout(attrs: {
  alignment?: unknown;
  textWrapping?: unknown;
}): NoteImageLayout {
  const alignment = Object.values(Alignment).includes(
    attrs.alignment as Alignment,
  )
    ? (attrs.alignment as Alignment)
    : Alignment.Left;
  const textWrapping = Object.values(TextWrapping).includes(
    attrs.textWrapping as TextWrapping,
  )
    ? (attrs.textWrapping as TextWrapping)
    : TextWrapping.BreakText;
  return { alignment, textWrapping };
}

/**
 * Places an image by its `data-alignment` and `data-wrap` attributes. A
 * wrapped image floats beside the text with a gap; a centred one never
 * floats, so text breaks around it either way.
 */
export const noteImagePlacementStyles = {
  marginBlock: "2",
  "&[data-alignment=center]": { marginInline: "auto" },
  "&[data-alignment=right]": { marginLeft: "auto" },
  "&[data-wrap][data-alignment=left]": {
    float: "left",
    marginRight: "4",
  },
  "&[data-wrap][data-alignment=right]": {
    float: "right",
    marginLeft: "4",
  },
} as const;
