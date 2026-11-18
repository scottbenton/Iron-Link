import { Toolbar } from "@base-ui/react/toolbar";
import {
  ComponentProps,
  ReactNode,
  forwardRef,
  useLayoutEffect,
  useRef,
} from "react";

import { css, cva, cx } from "styled-system/css";

import { Tooltip } from "../../components/Tooltip";

const rootStyles = css({
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: "2",
  minWidth: 0,
  fontFamily: "body",
});

const stripStyles = css({
  boxSizing: "border-box",
  display: "flex",
  minWidth: 0,
  padding: "1",
  borderRadius: "md",
  background: "bg.emphasized",
  overflowX: "auto",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
  // Faded at an edge while more of the row lies past it. The mask is on the
  // scroller, so it works on any background and never takes a tap.
  "&[data-fade-start]": {
    maskImage: "linear-gradient(to right, transparent, #000 24px)",
  },
  "&[data-fade-end]": {
    maskImage: "linear-gradient(to right, #000 calc(100% - 24px), transparent)",
  },
  "&[data-fade-start][data-fade-end]": {
    maskImage:
      "linear-gradient(to right, transparent, #000 24px, #000 calc(100% - 24px), transparent)",
  },
  "&[data-wrap]": { overflowX: "visible", maskImage: "none" },
});

const rowStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "0.5",
  flex: "none",
  minWidth: "100%",
  "[data-wrap] > &": { flexWrap: "wrap", flex: "1 1 auto", minWidth: 0 },
});

/**
 * Toolbar buttons have no ledge, so they never move: hover tints them and a
 * press darkens the tint (README, the look).
 */
const toolbarButtonStyles = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.5",
    flex: "none",
    minHeight: "32px",
    minWidth: "32px",
    paddingInline: "2.5",
    border: 0,
    borderRadius: "sm",
    background: "transparent",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "sm",
    fontWeight: "semibold",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    textDecoration: "none",
    cursor: "pointer",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
    transition: "background-color token(durations.fast) linear",
    "& svg": { width: "18px", height: "18px", flex: "none" },
    _hover: { background: "overlay.hover" },
    _pressed: { background: "overlay.pressed" },
    _focusVisible: {
      outline: "2px solid token(colors.focusRing)",
      outlineOffset: "-2px",
    },
    "&[aria-pressed=true]": { background: "overlay.selected" },
    "&:is(:disabled, [data-disabled])": {
      cursor: "not-allowed",
      color: "fg.disabled",
      background: "transparent",
    },
    _touch: { minHeight: "40px", minWidth: "40px" },
  },
  variants: {
    iconOnly: { true: { paddingInline: 0 }, false: {} },
    /** Red text, for a destructive action that asks to confirm. */
    danger: { true: { color: "danger.fg" }, false: {} },
  },
});

const iconSlotStyles = css({ display: "flex" });

const separatorStyles = css({
  flex: "none",
  alignSelf: "stretch",
  width: "1px",
  marginBlock: "1",
  marginInline: "1",
  background: "border.default",
});

const groupStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "0.5",
});

/** Marks the strip's edges that have more of the row beyond them. */
function useScrollFade(enabled: boolean) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const row = rowRef.current;
    if (!enabled || !scroller || !row) return;

    const update = () => {
      // Within a pixel of an edge counts as at it: scroll positions can be
      // fractional while widths are whole. abs() covers right-to-left.
      const scrollStart = Math.abs(scroller.scrollLeft);
      const hasStart = scrollStart > 1;
      const hasEnd =
        scrollStart + scroller.clientWidth < scroller.scrollWidth - 1;
      scroller.toggleAttribute("data-fade-start", hasStart);
      scroller.toggleAttribute("data-fade-end", hasEnd);
    };

    update();
    scroller.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    observer.observe(row);
    return () => {
      scroller.removeEventListener("scroll", update);
      observer.disconnect();
      scroller.removeAttribute("data-fade-start");
      scroller.removeAttribute("data-fade-end");
    };
  }, [enabled]);

  return { scrollerRef, rowRef };
}

export interface ActionToolbarProps {
  /** The toolbar's name, such as "Note actions". */
  label: string;
  /** Above the strip, such as Breadcrumbs to the open note. */
  breadcrumbs?: ReactNode;
  /** ActionToolbarButton, ActionToolbarIconButton, groups and separators. */
  children?: ReactNode;
  /**
   * Wrap actions that don't fit onto more rows instead of scrolling them
   * sideways, for strips whose actions should all stay in view.
   */
  wrap?: boolean;
  className?: string;
}

/**
 * Breadcrumbs over a strip of actions for the open item (a note, a folder,
 * a world entry). The strip is one Tab stop; arrow keys move along it, and
 * actions that don't fit scroll sideways with a fade at the clipped edge.
 */
export function ActionToolbar(props: ActionToolbarProps) {
  const { label, breadcrumbs, children, wrap = false, className } = props;
  const { scrollerRef, rowRef } = useScrollFade(!wrap && !!children);

  return (
    <div className={cx(rootStyles, className)}>
      {breadcrumbs}
      {children && (
        <Toolbar.Root
          ref={scrollerRef}
          aria-label={label}
          className={stripStyles}
          data-wrap={wrap || undefined}
        >
          <div ref={rowRef} className={rowStyles}>
            {children}
          </div>
        </Toolbar.Root>
      )}
    </div>
  );
}

export interface ActionToolbarButtonProps
  extends Omit<ComponentProps<typeof Toolbar.Button>, "className"> {
  /** An icon before the label. */
  icon?: ReactNode;
  /** Red text, for a destructive action that asks to confirm. */
  danger?: boolean;
  className?: string;
}

/** A labelled action in the strip. */
export const ActionToolbarButton = forwardRef<
  HTMLButtonElement,
  ActionToolbarButtonProps
>(function ActionToolbarButton(props, ref) {
  const { icon, danger, children, className, ...rest } = props;
  return (
    <Toolbar.Button
      ref={ref}
      className={cx(toolbarButtonStyles({ danger }), className)}
      {...rest}
    >
      {icon && (
        <span aria-hidden="true" className={iconSlotStyles}>
          {icon}
        </span>
      )}
      {children}
    </Toolbar.Button>
  );
});

export interface ActionToolbarIconButtonProps
  extends Omit<ActionToolbarButtonProps, "icon" | "children"> {
  /** The accessible name, also shown as the tooltip. */
  label: string;
  /** The icon. */
  children: ReactNode;
}

/** An icon-only action, named by `label` and shown as a tooltip. */
export const ActionToolbarIconButton = forwardRef<
  HTMLButtonElement,
  ActionToolbarIconButtonProps
>(function ActionToolbarIconButton(props, ref) {
  const { label, children, danger, className, ...rest } = props;
  return (
    <Tooltip title={label} side="bottom">
      <Toolbar.Button
        ref={ref}
        aria-label={label}
        className={cx(
          toolbarButtonStyles({ iconOnly: true, danger }),
          className,
        )}
        {...rest}
      >
        {children}
      </Toolbar.Button>
    </Tooltip>
  );
});

/** A thin rule between groups of actions. */
export function ActionToolbarSeparator() {
  return <Toolbar.Separator className={separatorStyles} />;
}

/** Actions that belong together, such as text formatting. */
export function ActionToolbarGroup(
  props: Omit<ComponentProps<typeof Toolbar.Group>, "className"> & {
    className?: string;
  },
) {
  const { className, ...rest } = props;
  return <Toolbar.Group className={cx(groupStyles, className)} {...rest} />;
}
