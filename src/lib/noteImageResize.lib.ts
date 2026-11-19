// Sizing rules for resizing an image in a note. Widths are CSS pixels, as
// the image node stores them; a null width fills the column.

export const MIN_NOTE_IMAGE_WIDTH = 50;
// A keyboard step, as a share of the column's width.
export const NOTE_IMAGE_WIDTH_STEP = 0.05;

export type NoteImageResizeEdge = "left" | "right";
export type NoteImageAlignment = "left" | "center" | "right";

// The handle sits on the edge that moves: the right one, except for an image
// held against the right side of the column.
export function getNoteImageResizeEdge(
  alignment: NoteImageAlignment,
): NoteImageResizeEdge {
  return alignment === "right" ? "left" : "right";
}

export function clampNoteImageWidth(width: number, columnWidth: number) {
  const max = Math.max(columnWidth, MIN_NOTE_IMAGE_WIDTH);
  return Math.round(Math.min(Math.max(width, MIN_NOTE_IMAGE_WIDTH), max));
}

// The width while dragging the handle `deltaX` pixels from where the drag
// started. A centred image grows on both sides, so it grows twice as fast.
export function getDraggedNoteImageWidth(options: {
  startWidth: number;
  deltaX: number;
  alignment: NoteImageAlignment;
  columnWidth: number;
}) {
  const { startWidth, deltaX, alignment, columnWidth } = options;
  let growth = getNoteImageResizeEdge(alignment) === "left" ? -deltaX : deltaX;
  if (alignment === "center") {
    growth *= 2;
  }
  return clampNoteImageWidth(startWidth + growth, columnWidth);
}

// The width after a key press on the handle, or undefined for a key it does
// not use. Arrows step by a share of the column; Home and End go to the
// limits.
export function getKeyboardNoteImageWidth(
  key: string,
  width: number,
  columnWidth: number,
): number | undefined {
  const step = Math.max(columnWidth * NOTE_IMAGE_WIDTH_STEP, 1);
  switch (key) {
    case "ArrowRight":
    case "ArrowUp":
      return clampNoteImageWidth(width + step, columnWidth);
    case "ArrowLeft":
    case "ArrowDown":
      return clampNoteImageWidth(width - step, columnWidth);
    case "PageUp":
      return clampNoteImageWidth(width + step * 4, columnWidth);
    case "PageDown":
      return clampNoteImageWidth(width - step * 4, columnWidth);
    case "Home":
      return clampNoteImageWidth(MIN_NOTE_IMAGE_WIDTH, columnWidth);
    case "End":
      return clampNoteImageWidth(columnWidth, columnWidth);
    default:
      return undefined;
  }
}

// What to store: an image as wide as its column stores no width, so it keeps
// filling the column on a wider screen.
export function getStoredNoteImageWidth(width: number, columnWidth: number) {
  return width >= columnWidth - 1 ? null : width;
}

export function getNoteImageWidthPercent(width: number, columnWidth: number) {
  if (columnWidth <= 0) return 100;
  return Math.min(100, Math.round((width / columnWidth) * 100));
}
