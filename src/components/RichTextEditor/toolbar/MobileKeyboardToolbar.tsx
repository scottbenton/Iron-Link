import {
  MouseEventHandler,
  PropsWithChildren,
  Ref,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { KeyboardToolbar } from "ui/layout/KeyboardToolbar";

import {
  subscribeVisibleArea,
  useSettledKeyboardInset,
} from "hooks/useKeyboardInset";

import { getBottomBarTransform } from "lib/keyboardInset";

import { useReportToolbarClearance } from "../toolbarClearance";

export interface MobileKeyboardToolbarProps extends PropsWithChildren {
  /** Names the toolbar, such as "Formatting". */
  label: string;
  // Hidden, it keeps its layout, and leaves the tab order and the
  // accessibility tree.
  hidden?: boolean;
  /** The bar element, which the bar's own controls are inside. */
  ref?: Ref<HTMLDivElement>;
  onMouseDown?: MouseEventHandler<HTMLDivElement>;
}

// The phone editor toolbar, raised by the keyboard's height so it rides on
// the keyboard. Notes and world entry Notes share it. While it shows, it
// tells the editor whose toolbar it is how much of the window's bottom it
// covers, keyboard included.
export function MobileKeyboardToolbar(props: MobileKeyboardToolbarProps) {
  const { label, hidden, ref, onMouseDown, children } = props;

  const bar = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => bar.current!, []);
  const settledInset = useSettledKeyboardInset();
  const [barHeight, setBarHeight] = useState(0);
  useReportToolbarClearance(hidden ? 0 : barHeight + settledInset);

  // Follows the keyboard frame by frame by writing to the bar itself, outside
  // React, so the toolbar doesn't re-render as the keyboard moves; a
  // transform moves it without layout. While the page is pinch zoomed the
  // transform also keeps the bar at its own size on the zoomed view.
  // `data-keyboard-open` drops the safe-area padding, and is never rendered
  // so React does not overwrite it.
  useLayoutEffect(() => {
    const element = bar.current;
    if (!element) return;
    const unsubscribe = subscribeVisibleArea((area) => {
      element.style.transform = getBottomBarTransform(area);
      element.toggleAttribute("data-keyboard-open", area.inset > 0);
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

  return (
    <KeyboardToolbar
      ref={bar}
      aria-label={label}
      hidden={hidden}
      onMouseDown={onMouseDown}
    >
      {children}
    </KeyboardToolbar>
  );
}
