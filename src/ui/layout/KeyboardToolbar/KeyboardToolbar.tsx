import { MouseEventHandler, ReactNode, forwardRef, useRef } from "react";
import { createPortal } from "react-dom";

import { Toolbar } from "ui/components/Toolbar";
import { useScrollFade } from "ui/hooks/useScrollFade";

import { css } from "styled-system/css";

const barStyles = css({
  position: "fixed",
  insetInline: 0,
  bottom: 0,
  // Above the page's own sticky chrome. A MobileNav steps aside while the
  // bar shows, rather than sitting under it.
  zIndex: "sticky",
  // Scaled for pinch zoom from the corner it is fixed by.
  transformOrigin: "left bottom",
  background: "bg.surface",
  borderTop: "1px solid token(colors.border.subtle)",
  // With the keyboard closed the bar sits on the home indicator's edge, so
  // it keeps clear of it; on the keyboard there is no such edge.
  paddingBottom: "env(safe-area-inset-bottom, 0px)",
  "&[data-keyboard-open]": { paddingBottom: 0 },
});

const stripStyles = css({
  flexWrap: "nowrap",
  paddingInline: "2",
  overflowX: "auto",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
  // Faded at an edge while more of the row lies past it. The mask is on the
  // scroller, so it never takes a tap.
  "&[data-overflow-start]": {
    maskImage: "linear-gradient(to right, transparent, #000 24px)",
  },
  "&[data-overflow-end]": {
    maskImage: "linear-gradient(to right, #000 calc(100% - 24px), transparent)",
  },
  "&[data-overflow-start][data-overflow-end]": {
    maskImage:
      "linear-gradient(to right, transparent, #000 24px, #000 calc(100% - 24px), transparent)",
  },
});

export interface KeyboardToolbarProps {
  /** Names the toolbar, such as "Formatting". */
  "aria-label": string;
  /**
   * Hidden, the bar keeps its layout but leaves the tab order and the
   * accessibility tree, so it can come back without a jump.
   */
  hidden?: boolean;
  /** Toolbar controls, which are 44px on a touch screen. */
  children?: ReactNode;
  /**
   * Called for a press anywhere on the bar, such as to keep an editor's
   * focus (and the keyboard) by preventing the default.
   */
  onMouseDown?: MouseEventHandler<HTMLDivElement>;
}

/**
 * A toolbar fixed to the bottom of the window, for a phone editor. Controls
 * that don't fit scroll sideways with a fade at the clipped edge.
 *
 * The bar only draws. Riding on the keyboard is the caller's: it writes a
 * `transform` to the forwarded element as the visible area changes, and sets
 * `data-keyboard-open` there to drop the safe-area padding. Portalled to the
 * body, so nothing on the page becomes its containing block. A MobileNav
 * hides while the bar shows, so the two never share the bottom edge.
 */
export const KeyboardToolbar = forwardRef<HTMLDivElement, KeyboardToolbarProps>(
  function KeyboardToolbar(props, ref) {
    const { "aria-label": label, hidden, onMouseDown, children } = props;
    const strip = useRef<HTMLDivElement>(null);
    useScrollFade(strip);

    return createPortal(
      <div
        ref={ref}
        className={barStyles}
        onMouseDown={onMouseDown}
        style={hidden ? { visibility: "hidden" } : undefined}
        data-keyboard-toolbar-shown={hidden ? undefined : ""}
      >
        <Toolbar
          ref={strip}
          variant="plain"
          aria-label={label}
          className={stripStyles}
        >
          {children}
        </Toolbar>
      </div>,
      document.body,
    );
  },
);
