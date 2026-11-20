import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { ComponentProps, ReactNode } from "react";

import { css, cva, cx } from "styled-system/css";

import { useIsMobile } from "../../hooks/useIsMobile";
import { isPressOnToasts } from "../Toast/toastViewport";

type Placement = "left" | "right" | "bottom";

const backdropStyles = css({
  position: "fixed",
  inset: 0,
  zIndex: "drawer",
  background: "backdrop",
  opacity: "calc(1 - var(--drawer-swipe-progress, 0))",
  transition: "opacity token(durations.normal) linear",
  _startingStyle: { opacity: 0 },
  _endingStyle: { opacity: 0, transitionDuration: "fast" },
  "&[data-swiping]": { transitionDuration: "0s" },
});

const viewportStyles = css({
  position: "fixed",
  inset: 0,
  zIndex: "drawer",
  display: "flex",
  "&[data-placement=right]": { justifyContent: "flex-end" },
  "&[data-placement=left]": { justifyContent: "flex-start" },
  "&[data-placement=bottom]": {
    alignItems: "flex-end",
    justifyContent: "center",
  },
});

const popupStyles = cva({
  base: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    maxWidth: "100%",
    background: "bg.surface",
    color: "fg.default",
    fontFamily: "body",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.control",
    outline: "none",
    overscrollBehavior: "contain",
    transitionProperty: "transform, opacity",
    transitionDuration: "normal",
    transitionTimingFunction: "out",
    _endingStyle: {
      transitionDuration: "fast",
      transitionTimingFunction: "in",
    },
    "&[data-swiping]": { transitionDuration: "0s", userSelect: "none" },

    "&[data-placement=right]": {
      height: "100dvh",
      width: "min(var(--drawer-width), calc(100vw - 32px))",
      borderInlineEndWidth: 0,
      borderStartStartRadius: "xl",
      borderEndStartRadius: "xl",
      transform: "translateX(var(--drawer-swipe-movement-x, 0px))",
      "&:is([data-starting-style], [data-ending-style])": {
        transform: "translateX(100%)",
      },
    },
    "&[data-placement=left]": {
      height: "100dvh",
      width: "min(var(--drawer-width), calc(100vw - 32px))",
      borderInlineStartWidth: 0,
      borderStartEndRadius: "xl",
      borderEndEndRadius: "xl",
      transform: "translateX(var(--drawer-swipe-movement-x, 0px))",
      "&:is([data-starting-style], [data-ending-style])": {
        transform: "translateX(-100%)",
      },
    },
    "&[data-placement=bottom]": {
      width: "100%",
      maxWidth: "var(--drawer-sheet-width)",
      maxHeight: "85dvh",
      borderBottomWidth: 0,
      borderTopLeftRadius: "xl",
      borderTopRightRadius: "xl",
      transform: "translateY(var(--drawer-swipe-movement-y, 0px))",
      "&:is([data-starting-style], [data-ending-style])": {
        transform: "translateY(100%)",
      },
    },
    // Without motion the drawer fades in place; a swipe still follows the finger.
    _reducedMotion: {
      "&:is([data-starting-style], [data-ending-style])": {
        transform: "none!",
        opacity: 0,
      },
    },
  },
  variants: {
    size: {
      sm: { "--drawer-width": "320px", "--drawer-sheet-width": "640px" },
      md: { "--drawer-width": "380px", "--drawer-sheet-width": "640px" },
      lg: { "--drawer-width": "480px", "--drawer-sheet-width": "760px" },
    },
  },
  defaultVariants: { size: "md" },
});

const handleStyles = css({
  flex: "none",
  width: "36px",
  height: "4px",
  marginBlockStart: "2",
  marginInline: "auto",
  borderRadius: "full",
  background: "border.default",
});

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** The edge it slides from on wide screens. */
  side?: Placement;
  /**
   * On phones, a side drawer becomes a bottom sheet (`sheet`, for tool
   * drawers such as oracles and moves) or stays at its side (`side`, for
   * navigation).
   */
  mobile?: "sheet" | "side";
  /** Width of a side drawer: 320, 380 or 480px. */
  size?: "sm" | "md" | "lg";
  /**
   * Whether the page behind is blocked. A modal drawer traps focus and
   * closes on Escape or a press on the backdrop.
   */
  modal?: boolean;
  /** Names the drawer when it has no DrawerHeader title. */
  "aria-label"?: string;
  className?: string;
  /** Element to focus on open; defaults to the first focusable. */
  initialFocus?: ComponentProps<typeof BaseDrawer.Popup>["initialFocus"];
  /** Element to focus on close; defaults to the trigger. */
  finalFocus?: ComponentProps<typeof BaseDrawer.Popup>["finalFocus"];
}

/**
 * A panel that slides in from an edge: the side on wide screens and up from
 * the bottom on phones. Swipe it back towards its edge to close it. Compose
 * it from DrawerHeader, DrawerBody and DrawerFooter.
 */
export function Drawer(props: DrawerProps) {
  const {
    open,
    onClose,
    children,
    side = "right",
    mobile = "sheet",
    size,
    modal = true,
    "aria-label": ariaLabel,
    className,
    initialFocus,
    finalFocus,
  } = props;

  // Phone width (the CSS's `smDown`) is needed in JavaScript as well as CSS,
  // because the swipe direction that dismisses the drawer is a prop.
  const isPhone = useIsMobile();
  const placement: Placement =
    side === "bottom" || (isPhone && mobile === "sheet") ? "bottom" : side;

  return (
    <BaseDrawer.Root
      open={open}
      onOpenChange={(nextOpen, details) => {
        // Toasts sit above modals; pressing one is not a press outside.
        if (!nextOpen && !isPressOnToasts(details)) onClose();
      }}
      swipeDirection={placement === "bottom" ? "down" : placement}
      modal={modal}
    >
      <BaseDrawer.Portal>
        {modal && <BaseDrawer.Backdrop className={backdropStyles} />}
        <BaseDrawer.Viewport
          className={viewportStyles}
          data-placement={placement}
        >
          <BaseDrawer.Popup
            className={cx("ui-root", popupStyles({ size }), className)}
            data-placement={placement}
            aria-label={ariaLabel}
            initialFocus={initialFocus}
            finalFocus={finalFocus}
          >
            {placement === "bottom" && (
              <div className={handleStyles} aria-hidden />
            )}
            {children}
          </BaseDrawer.Popup>
        </BaseDrawer.Viewport>
      </BaseDrawer.Portal>
    </BaseDrawer.Root>
  );
}
