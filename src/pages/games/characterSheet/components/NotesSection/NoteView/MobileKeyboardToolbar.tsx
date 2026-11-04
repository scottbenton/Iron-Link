import { Box } from "@mui/material";
import { PropsWithChildren, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useReportToolbarClearance } from "components/RichTextEditor/toolbarClearance";

import {
  subscribeKeyboardInset,
  useSettledKeyboardInset,
} from "hooks/useKeyboardInset";

// The row of buttons, under the bar's 1px top border.
const MOBILE_KEYBOARD_TOOLBAR_ROW_HEIGHT = 40;

export interface MobileKeyboardToolbarProps extends PropsWithChildren {
  // Hidden, it keeps its layout, and leaves the tab order and the
  // accessibility tree.
  hidden?: boolean;
}

// A toolbar fixed to the bottom of the window and raised by the keyboard's
// height, so on a phone it rides on the keyboard. Notes and world entry Notes
// share it. While it shows, it tells the editor whose toolbar it is how much
// of the window's bottom it covers, keyboard included.
//
// Portalled to the body: it belongs to the window's bottom edge rather than
// to the page, and nothing on the page may become its containing block.
export function MobileKeyboardToolbar(props: MobileKeyboardToolbarProps) {
  const { hidden, children } = props;

  const bar = useRef<HTMLDivElement>(null);
  const settledInset = useSettledKeyboardInset();
  const [barHeight, setBarHeight] = useState(0);
  useReportToolbarClearance(hidden ? 0 : barHeight + settledInset);

  // Follows the keyboard frame by frame by writing to the bar itself, outside
  // React, so the toolbar doesn't re-render as the keyboard moves; a
  // transform moves it without layout. `data-keyboard-open` drops the
  // safe-area padding, and is never rendered so React does not overwrite it.
  useLayoutEffect(() => {
    const element = bar.current;
    if (!element) return;
    const unsubscribe = subscribeKeyboardInset((inset) => {
      element.style.transform = inset > 0 ? `translateY(${-inset}px)` : "";
      element.toggleAttribute("data-keyboard-open", inset > 0);
    });
    return () => {
      unsubscribe();
      element.style.transform = "";
      element.removeAttribute("data-keyboard-open");
    };
  }, []);

  useLayoutEffect(() => {
    const element = bar.current;
    if (!element) return;
    setBarHeight(element.getBoundingClientRect().height);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      setBarHeight(element.getBoundingClientRect().height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return createPortal(
    <Box
      ref={bar}
      sx={(theme) => ({
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar - 1,
        bgcolor:
          theme.palette.mode === "light" ? "background.paper" : "grey.700",
        borderTop: `1px solid ${theme.palette.divider}`,
        // With the keyboard closed the bar sits on the home indicator's
        // edge, so it keeps clear of it; on the keyboard there is no such
        // edge.
        pb: "env(safe-area-inset-bottom, 0px)",
        "&[data-keyboard-open]": { pb: 0 },
        visibility: hidden ? "hidden" : undefined,
      })}
    >
      <Box
        height={MOBILE_KEYBOARD_TOOLBAR_ROW_HEIGHT}
        display="flex"
        px={2}
        gap={0.5}
        overflow="auto"
      >
        {children}
      </Box>
    </Box>,
    document.body,
  );
}
