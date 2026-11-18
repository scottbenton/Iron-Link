import {
  KeyboardEvent,
  PointerEvent,
  RefObject,
  useEffect,
  useRef,
} from "react";

import { css, cx } from "styled-system/css";

/** How far past the minimum a drag goes before it collapses the sidebar. */
const COLLAPSE_SLOP = 72;
const STEP = 16;
const BIG_STEP = 64;

const handleStyles = css({
  position: "absolute",
  top: 0,
  bottom: 0,
  zIndex: 2,
  width: "12px",
  display: "flex",
  justifyContent: "center",
  cursor: "col-resize",
  touchAction: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  // A wider grip for fingers, without taking room from the columns.
  _touch: { width: "24px" },
  // The line: the column's border, thickened on hover, focus and drag.
  _before: {
    content: '""',
    width: "3px",
    height: "100%",
    borderRadius: "full",
    background: "transparent",
    transition: "background-color token(durations.fast) linear",
  },
  _hover: { _before: { background: "border.control" } },
  _focusVisible: { _before: { background: "focusRing" } },
  "&[data-dragging]": { _before: { background: "accent.solid" } },
  "&[data-collapse-intent]": { _before: { background: "fg.subtle" } },
});

const sideStyles = {
  start: css({ insetInlineEnd: "-6px", _touch: { insetInlineEnd: "-12px" } }),
  end: css({ insetInlineStart: "-6px", _touch: { insetInlineStart: "-12px" } }),
};

export interface SidebarResizeHandleProps {
  /** The sidebar it sizes, for aria-controls and measuring. */
  targetId: string;
  targetRef: RefObject<HTMLElement | null>;
  side: "start" | "end";
  width: number;
  minWidth: number;
  maxWidth: number;
  /** What a double click resets to. */
  defaultWidth: number;
  /** Once per drag (on release) and once per key press. */
  onWidthChange: (width: number) => void;
  /** A drag well past the minimum, or Enter, collapses the sidebar. */
  onCollapse?: () => void;
  label: string;
  /** "{width} pixels" for screen readers. */
  formatValue?: (width: number) => string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * The splitter on a sidebar's inner edge (the WAI-ARIA window splitter): a
 * focusable separator whose value is the sidebar's width. Arrow keys resize
 * by 16px (64px with Shift), Home and End go to the limits, Enter collapses,
 * a double click resets, and Escape cancels a drag. Dragging previews the width on the element itself and reports it once on
 * release, so the page does not re-render on every pointer move.
 */
export function SidebarResizeHandle(props: SidebarResizeHandleProps) {
  const {
    targetId,
    targetRef,
    side,
    width,
    minWidth,
    maxWidth,
    defaultWidth,
    onWidthChange,
    onCollapse,
    label,
    formatValue = (value) => `${value} pixels`,
  } = props;

  const handleRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startWidth: number;
    width: number;
    collapse: boolean;
  } | null>(null);

  // Moving the pointer toward the main column grows the sidebar.
  const direction = () => {
    const rtl =
      !!handleRef.current &&
      getComputedStyle(handleRef.current).direction === "rtl";
    const sign = side === "start" ? 1 : -1;
    return rtl ? -sign : sign;
  };

  const renderedWidth = () =>
    Math.round(targetRef.current?.getBoundingClientRect().width ?? width);

  const preview = (next: number, collapse: boolean) => {
    targetRef.current?.style.setProperty("--sidebar-width", `${next}px`);
    const handle = handleRef.current;
    if (!handle) return;
    handle.setAttribute("aria-valuenow", String(next));
    handle.setAttribute("aria-valuetext", formatValue(next));
    handle.toggleAttribute("data-collapse-intent", collapse);
  };

  // Escape during a drag puts the width back. The handle seldom has focus
  // while dragging, so the key is heard on the window.
  const escapeListener = useRef<
    ((event: globalThis.KeyboardEvent) => void) | null
  >(null);

  const endDrag = (commit: boolean) => {
    const state = drag.current;
    const handle = handleRef.current;
    drag.current = null;
    if (escapeListener.current) {
      window.removeEventListener("keydown", escapeListener.current, true);
      escapeListener.current = null;
    }
    if (!state || !handle) return;
    if (handle.hasPointerCapture(state.pointerId)) {
      handle.releasePointerCapture(state.pointerId);
    }
    handle.removeAttribute("data-dragging");
    handle.removeAttribute("data-collapse-intent");
    document.documentElement.style.removeProperty("cursor");

    if (commit && state.collapse && onCollapse) {
      preview(width, false);
      onCollapse();
    } else if (commit && state.width !== width) {
      onWidthChange(state.width);
    } else {
      preview(width, false);
    }
  };

  // A drag cut short by unmounting leaves no listener or cursor behind.
  useEffect(
    () => () => {
      if (escapeListener.current) {
        window.removeEventListener("keydown", escapeListener.current, true);
      }
      if (drag.current) document.documentElement.style.removeProperty("cursor");
    },
    [],
  );

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const startWidth = clamp(renderedWidth(), minWidth, maxWidth);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth,
      width: startWidth,
      collapse: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.setAttribute("data-dragging", "");
    // Keeps the resize cursor while the pointer is over other elements.
    document.documentElement.style.cursor = "col-resize";
    const onEscape = (keyEvent: globalThis.KeyboardEvent) => {
      if (keyEvent.key !== "Escape") return;
      keyEvent.preventDefault();
      keyEvent.stopPropagation();
      endDrag(false);
    };
    escapeListener.current = onEscape;
    window.addEventListener("keydown", onEscape, true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const raw = state.startWidth + (event.clientX - state.startX) * direction();
    state.width = Math.round(clamp(raw, minWidth, maxWidth));
    state.collapse = !!onCollapse && raw < minWidth - COLLAPSE_SLOP;
    preview(state.width, state.collapse);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? BIG_STEP : STEP;
    // Start from what is drawn: the width may be capped by the screen.
    const current = clamp(renderedWidth(), minWidth, maxWidth);
    let next: number | null = null;
    switch (event.key) {
      case "ArrowLeft":
        next = current - step * direction();
        break;
      case "ArrowRight":
        next = current + step * direction();
        break;
      case "Home":
        next = minWidth;
        break;
      case "End":
        next = maxWidth;
        break;
      case "Enter":
        if (onCollapse) {
          event.preventDefault();
          onCollapse();
        }
        return;
      default:
        return;
    }
    event.preventDefault();
    next = clamp(next, minWidth, maxWidth);
    if (next !== width) onWidthChange(next);
    else preview(next, false);
  };

  return (
    <div
      ref={handleRef}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-controls={targetId}
      aria-valuenow={width}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      aria-valuetext={formatValue(width)}
      tabIndex={0}
      className={cx(handleStyles, sideStyles[side])}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => endDrag(true)}
      onPointerCancel={() => endDrag(false)}
      onLostPointerCapture={() => {
        if (drag.current) endDrag(true);
      }}
      onDoubleClick={() => {
        if (defaultWidth !== width) onWidthChange(defaultWidth);
      }}
      onKeyDown={handleKeyDown}
    />
  );
}
