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
  getDraggedNoteImageWidth,
  getKeyboardNoteImageWidth,
  getNoteImageResizeEdge,
  getNoteImageWidthPercent,
  getStoredNoteImageWidth,
} from "lib/noteImageResize.lib";

export interface ImageResizeHandleProps {
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
  startX: number;
  startWidth: number;
  columnWidth: number;
  width: number;
}

// A grip on the image's moving edge. It is a button, so the editor leaves
// its pointer and key events alone (Tiptap's node views stop events from
// buttons), and a slider for screen readers and the keyboard.
export function ImageResizeHandle(props: ImageResizeHandleProps) {
  const { alignment, visible, imageRef, columnRef, onPreview, onResize } =
    props;

  const { t } = useTranslation();
  const isTouchDevice = useIsTouchDevice();
  const edge = getNoteImageResizeEdge(alignment);

  const dragRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const { width, columnWidth } = measure();
    if (columnWidth <= 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: width,
      columnWidth,
      width,
    };
    setIsDragging(true);
    setPercent(getNoteImageWidthPercent(width, columnWidth));
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    drag.width = getDraggedNoteImageWidth({
      startWidth: drag.startWidth,
      deltaX: event.clientX - drag.startX,
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
    setIsDragging(false);
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
      setIsDragging(false);
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
  const shown = visible || isDragging;

  return (
    <Box
      component="button"
      type="button"
      role="slider"
      tabIndex={visible ? 0 : -1}
      aria-label={t("notes.image-node.resize", "Image width")}
      aria-orientation="horizontal"
      aria-valuemin={minPercent}
      aria-valuemax={100}
      aria-valuenow={percent ?? 100}
      aria-valuetext={t(
        "notes.image-node.resize-value",
        "{{percent}}% of the note's width",
        { percent: percent ?? 100 },
      )}
      data-dragging={isDragging ? "" : undefined}
      onFocus={updatePercent}
      onPointerEnter={updatePercent}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event: PointerEvent<HTMLButtonElement>) =>
        endDrag(event, true)
      }
      onPointerCancel={(event: PointerEvent<HTMLButtonElement>) =>
        endDrag(event, false)
      }
      onLostPointerCapture={(event: PointerEvent<HTMLButtonElement>) =>
        endDrag(event, true)
      }
      onKeyDown={handleKeyDown}
      onClick={(event) => event.preventDefault()}
      sx={(theme) => ({
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        [edge]: 0,
        zIndex: 1,
        // The target is wider than the grip it draws, and touch-sized on
        // touch devices.
        width: isTouchDevice ? 44 : 24,
        height: isTouchDevice ? 64 : 48,
        maxHeight: "100%",
        p: 0,
        m: 0,
        border: "none",
        background: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "ew-resize",
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
          width: 8,
          height: "min(44px, 70%)",
          borderRadius: 4,
          backgroundColor: theme.palette.common.white,
          border: `1px solid ${theme.palette.grey[600]}`,
          boxShadow: theme.shadows[2],
        },
        "&:hover::after, &[data-dragging]::after, &:focus-visible::after": {
          backgroundColor: theme.palette.primary.main,
          borderColor: theme.palette.common.white,
        },
        // Two rings, so the focus shows on light and dark pictures alike.
        "&:focus-visible::after": {
          boxShadow: `0 0 0 2px ${theme.palette.common.white}, 0 0 0 4px ${theme.palette.primary.main}`,
        },
      })}
    />
  );
}
