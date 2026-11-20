import { Box } from "@mui/material";
import {
  KeyboardEvent,
  PointerEvent,
  RefObject,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { useIsTouchDevice } from "hooks/useIsTouchDevice";

import {
  MIN_NOTE_IMAGE_WIDTH,
  NoteImageAlignment,
  NoteImageResizeEdge,
  getDraggedNoteImageWidth,
  getKeyboardNoteImageWidth,
  getNoteImageResizeEdge,
  getNoteImageWidthPercent,
  getStoredNoteImageWidth,
} from "lib/noteImageResize.lib";

export interface ImageResizeHandlesProps {
  alignment: NoteImageAlignment;
  // Shown while the image is selected; otherwise on hover, while focused and
  // while dragging.
  visible: boolean;
  // The image's frame, measured when a resize starts.
  imageRef: RefObject<HTMLElement | null>;
  // The note's column, which bounds the width.
  columnRef: RefObject<HTMLElement | null>;
  // The width while dragging, drawn before it is saved; null when done.
  onPreview: (width: number | null) => void;
  // Saves a width; null fills the column.
  onResize: (width: number | null) => void;
}

interface DragState {
  pointerId: number;
  edge: NoteImageResizeEdge;
  startX: number;
  startWidth: number;
  columnWidth: number;
  width: number;
}

type Corner = {
  vertical: "top" | "bottom";
  horizontal: NoteImageResizeEdge;
};

const CORNERS: Corner[] = [
  { vertical: "top", horizontal: "left" },
  { vertical: "top", horizontal: "right" },
  { vertical: "bottom", horizontal: "left" },
  { vertical: "bottom", horizontal: "right" },
];

const SQUARE_SIZE = 12;

// Square handles on the image's corners; dragging one outward grows the
// image, keeping its shape. They are buttons, so the editor leaves their
// pointer and key events alone (Tiptap's node views stop events from
// buttons). The bottom corner on the edge that moves is also the keyboard's
// slider; the others are for pointers only.
export function ImageResizeHandles(props: ImageResizeHandlesProps) {
  const { alignment, visible, imageRef, columnRef, onPreview, onResize } =
    props;

  const { t } = useTranslation();
  const isTouchDevice = useIsTouchDevice();
  const keyboardEdge = getNoteImageResizeEdge(alignment);

  const dragRef = useRef<DragState | null>(null);
  const [dragCorner, setDragCorner] = useState<Corner | null>(null);
  const [percent, setPercent] = useState<number | null>(null);

  const measure = () => {
    const columnWidth = columnRef.current?.clientWidth ?? 0;
    const width =
      imageRef.current?.getBoundingClientRect().width ?? columnWidth;
    return { width, columnWidth };
  };

  // Read when focused or dragged, so the slider's value is current without
  // measuring on every render.
  const updatePercent = () => {
    const { width, columnWidth } = measure();
    setPercent(getNoteImageWidthPercent(width, columnWidth));
  };

  const startDrag = (
    event: PointerEvent<HTMLButtonElement>,
    corner: Corner,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const { width, columnWidth } = measure();
    if (columnWidth <= 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      edge: corner.horizontal,
      startX: event.clientX,
      startWidth: width,
      columnWidth,
      width,
    };
    setDragCorner(corner);
    setPercent(getNoteImageWidthPercent(width, columnWidth));
  };

  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    drag.width = getDraggedNoteImageWidth({
      startWidth: drag.startWidth,
      deltaX: event.clientX - drag.startX,
      edge: drag.edge,
      alignment,
      columnWidth: drag.columnWidth,
    });
    setPercent(getNoteImageWidthPercent(drag.width, drag.columnWidth));
    onPreview(drag.width);
  };

  const endDrag = (event: PointerEvent<HTMLButtonElement>, save: boolean) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragCorner(null);
    if (save && drag.width !== drag.startWidth) {
      onResize(getStoredNoteImageWidth(drag.width, drag.columnWidth));
    }
    onPreview(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Escape" && dragRef.current) {
      event.preventDefault();
      dragRef.current = null;
      setDragCorner(null);
      onPreview(null);
      return;
    }
    const { width, columnWidth } = measure();
    if (columnWidth <= 0) return;
    const nextWidth = getKeyboardNoteImageWidth(event.key, width, columnWidth);
    if (nextWidth === undefined) return;
    event.preventDefault();
    setPercent(getNoteImageWidthPercent(nextWidth, columnWidth));
    onResize(getStoredNoteImageWidth(nextWidth, columnWidth));
  };

  const columnWidth = columnRef.current?.clientWidth ?? 0;
  const minPercent =
    columnWidth > 0
      ? getNoteImageWidthPercent(MIN_NOTE_IMAGE_WIDTH, columnWidth)
      : 0;
  const shown = visible || dragCorner !== null;
  // The target is larger than the square it draws, and touch-sized on touch
  // devices. It reaches into the image from the corner, so nothing is drawn
  // outside the frame, where the editor's column would clip it.
  const targetSize = isTouchDevice ? 44 : 24;

  return CORNERS.map((corner) => {
    const isKeyboardHandle =
      corner.vertical === "bottom" && corner.horizontal === keyboardEdge;
    const isDragging =
      dragCorner?.vertical === corner.vertical &&
      dragCorner.horizontal === corner.horizontal;
    const cursor =
      (corner.vertical === "top") === (corner.horizontal === "left")
        ? "nwse-resize"
        : "nesw-resize";

    const sliderProps = isKeyboardHandle
      ? {
          role: "slider",
          tabIndex: visible ? 0 : -1,
          "aria-label": t("notes.image-node.resize", "Image width"),
          "aria-orientation": "horizontal" as const,
          "aria-valuemin": minPercent,
          "aria-valuemax": 100,
          "aria-valuenow": percent ?? 100,
          "aria-valuetext": t(
            "notes.image-node.resize-value",
            "{{percent}}% of the note's width",
            { percent: percent ?? 100 },
          ),
          onFocus: updatePercent,
          onKeyDown: handleKeyDown,
        }
      : { tabIndex: -1, "aria-hidden": true };

    return (
      <Box
        key={`${corner.vertical}-${corner.horizontal}`}
        component="button"
        type="button"
        {...sliderProps}
        data-dragging={isDragging ? "" : undefined}
        onPointerDown={(event: PointerEvent<HTMLButtonElement>) =>
          startDrag(event, corner)
        }
        onPointerMove={moveDrag}
        onPointerUp={(event: PointerEvent<HTMLButtonElement>) =>
          endDrag(event, true)
        }
        onPointerCancel={(event: PointerEvent<HTMLButtonElement>) =>
          endDrag(event, false)
        }
        onLostPointerCapture={(event: PointerEvent<HTMLButtonElement>) =>
          endDrag(event, true)
        }
        onClick={(event) => event.preventDefault()}
        sx={(theme) => ({
          position: "absolute",
          // Over the frame's 2px border, so the square sits on the corner.
          [corner.vertical]: -2,
          [corner.horizontal]: -2,
          zIndex: 1,
          width: targetSize,
          height: targetSize,
          maxWidth: "50%",
          maxHeight: "50%",
          p: 0,
          m: 0,
          border: "none",
          background: "none",
          display: "flex",
          alignItems: corner.vertical === "top" ? "flex-start" : "flex-end",
          justifyContent:
            corner.horizontal === "left" ? "flex-start" : "flex-end",
          cursor,
          touchAction: "none",
          opacity: shown ? 1 : 0,
          pointerEvents: shown ? "auto" : "none",
          transition: theme.transitions.create("opacity", {
            duration: theme.transitions.duration.shortest,
          }),
          "@media (hover: hover)": {
            ".note-image-frame:hover &": {
              opacity: 1,
              pointerEvents: "auto",
            },
          },
          "&:focus-visible": {
            opacity: 1,
            outline: "none",
          },
          "&::after": {
            content: '""',
            display: "block",
            flexShrink: 0,
            width: SQUARE_SIZE,
            height: SQUARE_SIZE,
            boxSizing: "border-box",
            backgroundColor: theme.palette.primary.main,
            border: `1px solid ${theme.palette.common.white}`,
            boxShadow: theme.shadows[1],
          },
          "&:hover::after, &[data-dragging]::after": {
            transform: "scale(1.2)",
          },
          // Two rings, so the focus shows on light and dark pictures alike.
          "&:focus-visible::after": {
            transform: "scale(1.2)",
            boxShadow: `0 0 0 2px ${theme.palette.common.white}, 0 0 0 4px ${theme.palette.primary.main}`,
          },
        })}
      />
    );
  });
}
