import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { Plus, X } from "@phosphor-icons/react";
import {
  ComponentProps,
  KeyboardEvent,
  ReactNode,
  forwardRef,
  useLayoutEffect,
  useRef,
} from "react";

import { css, cx } from "styled-system/css";

import { IconButton } from "../IconButton";
import {
  scrollStripStyles,
  useScrollFade,
  useScrollSelectedIntoView,
} from "./scrollStrip";

const rootStyles = css({
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  minHeight: 0,
});

const barStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
  flex: "none",
  boxSizing: "border-box",
  padding: "1.5",
  background: "bg.canvas",
  borderBottom: "1px solid token(colors.border.default)",
});

const listStyles = css({
  display: "flex",
  gap: "1",
  flex: "0 1 auto",
  minWidth: 0,
  // Room for the open note's ledge, which the scroller would clip.
  paddingBottom: "var(--border-widths-ledge)",
});

const chipStyles = css({
  position: "relative",
  flex: "none",
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  border: "1px solid transparent",
  borderRadius: "md",
  transition: "background-color token(durations.fast) linear",
  _hover: { background: "overlay.hover" },
  "&[data-selected]": {
    background: "bg.surface",
    borderColor: "border.default",
    boxShadow: "ledge",
  },
  "&[data-entering]": {
    animation: "fadeIn token(durations.normal) token(easings.out)",
  },
});

const tabStyles = css({
  display: "block",
  maxWidth: "16rem",
  boxSizing: "border-box",
  margin: 0,
  border: 0,
  background: "transparent",
  cursor: "pointer",
  paddingBlock: "7px 8px",
  paddingInlineStart: "3",
  paddingInlineEnd: "32px",
  borderRadius: "inherit",
  color: "fg.muted",
  fontFamily: "body",
  fontWeight: "semibold",
  fontSize: "sm",
  lineHeight: "1.2",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  userSelect: "none",
  WebkitTapHighlightColor: "transparent",
  transition: "color token(durations.fast) linear",
  outline: "none",
  _hover: { color: "fg.default" },
  "&[aria-selected=true]": { color: "fg.default" },
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "-2px",
  },
  _touch: { paddingBlock: "12px", paddingInline: "14px 44px" },
});

const closeStyles = css({
  position: "absolute",
  right: "5px",
  top: "50%",
  translate: "0 -50%",
  display: "grid",
  placeItems: "center",
  boxSizing: "border-box",
  width: "22px",
  height: "22px",
  padding: 0,
  margin: 0,
  border: 0,
  borderRadius: "xs",
  background: "transparent",
  color: "fg.subtle",
  cursor: "pointer",
  opacity: 0,
  transition:
    "opacity token(durations.fast) linear, background-color token(durations.fast) linear",
  outline: "none",
  "& svg": { width: "14px", height: "14px" },
  _hover: { background: "overlay.hover", color: "fg.default", opacity: 1 },
  _pressed: { background: "overlay.pressed" },
  _focusVisible: {
    opacity: 1,
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "0",
  },
  "[data-note-chip]:hover > &, [data-note-chip][data-selected] > &": {
    opacity: 1,
  },
  "@media (hover: none)": { opacity: 1 },
  _touch: { width: "36px", height: "36px", right: "4px" },
});

const addStyles = css({
  flex: "none",
  marginBottom: "var(--border-widths-ledge)",
});

const labelWithIconStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  "& svg": { flex: "none", width: "16px", height: "16px" },
});

const panelStyles = css({
  flex: "1 1 auto",
  minHeight: 0,
  overflow: "auto",
  outline: "none",
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "-2px",
  },
});

export interface NoteTab {
  /** The tab's value, matched by a `NoteTabPanel`. */
  id: string;
  /** The note's name. Also names its close button. */
  label: string;
  /** An icon before the name, such as a folder or a world. */
  icon?: ReactNode;
}

export interface NoteTabsProps {
  /** The open notes, in order. */
  tabs: NoteTab[];
  /** The open note's id, or null with none open. */
  value: string | null;
  onValueChange: (id: string) => void;
  /**
   * Closes a note. Choose the next note to show here: the strip moves focus
   * to it (or to the add button when none is left) when the close came from
   * the keyboard.
   */
  onClose: (id: string) => void;
  /** Adds a note. Without it there is no add button. */
  onAdd?: () => void;
  /** Names the strip. */
  "aria-label"?: string;
  /** The add button's name and tooltip. */
  addLabel?: string;
  /** Builds a close button's name from the note's name. */
  closeLabel?: (label: string) => string;
  /** The panels, one `NoteTabPanel` per tab; or an empty state. */
  children?: ReactNode;
  className?: string;
}

/**
 * The open notes as chips: the open note is a raised card on the canvas
 * strip. Each close button is a sibling of its tab, never inside it, so
 * screen readers reach both (CLAUDE.md, Notes). Arrow keys, Home and End
 * move between notes and open them; Delete closes the focused one; a
 * middle click closes too. The strip scrolls sideways with faded edges and
 * keeps the open note in view.
 */
export function NoteTabs(props: NoteTabsProps) {
  const {
    tabs,
    value,
    onValueChange,
    onClose,
    onAdd,
    "aria-label": ariaLabel = "Open notes",
    addLabel = "New Note",
    closeLabel = (label: string) => `Close ${label}`,
    children,
    className,
  } = props;

  const listRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLElement>(null);
  useScrollFade(listRef);
  useScrollSelectedIntoView(listRef, "[data-note-chip][data-selected]", value);

  // Tabs that were there before; a new one fades in.
  const seen = useRef<Set<string> | null>(null);
  const isFirstRender = seen.current === null;
  const entering = new Set(
    isFirstRender
      ? []
      : tabs.filter((tab) => !seen.current?.has(tab.id)).map((tab) => tab.id),
  );
  useLayoutEffect(() => {
    seen.current = new Set(tabs.map((tab) => tab.id));
  }, [tabs]);

  // After a close from the keyboard, focus follows to the note now open.
  const refocus = useRef(false);
  useLayoutEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    const selected = listRef.current?.querySelector<HTMLElement>(
      "[role=tab][aria-selected=true]",
    );
    (selected ?? addRef.current)?.focus();
  }, [tabs, value]);

  const close = (id: string) => {
    const active = document.activeElement;
    refocus.current = !!active && !!listRef.current?.contains(active);
    onClose(id);
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLElement>, id: string) => {
    if (event.key === "Delete") {
      event.preventDefault();
      close(id);
    }
  };

  return (
    <BaseTabs.Root
      value={value}
      onValueChange={(next) => {
        if (typeof next === "string") onValueChange(next);
      }}
      className={cx(rootStyles, className)}
    >
      <div className={barStyles}>
        <BaseTabs.List
          ref={listRef}
          aria-label={ariaLabel}
          activateOnFocus
          className={cx(scrollStripStyles, listStyles)}
        >
          {tabs.map((tab) => {
            const selected = tab.id === value;
            return (
              <span
                key={tab.id}
                role="presentation"
                data-note-chip=""
                data-selected={selected || undefined}
                data-entering={entering.has(tab.id) || undefined}
                className={chipStyles}
              >
                <BaseTabs.Tab
                  value={tab.id}
                  className={tabStyles}
                  onKeyDown={(event) => onTabKeyDown(event, tab.id)}
                  onMouseDown={(event) => {
                    // Stops the middle button's autoscroll.
                    if (event.button === 1) event.preventDefault();
                  }}
                  onAuxClick={(event) => {
                    if (event.button === 1) close(tab.id);
                  }}
                >
                  {tab.icon ? (
                    <span className={labelWithIconStyles}>
                      {tab.icon}
                      {tab.label}
                    </span>
                  ) : (
                    tab.label
                  )}
                </BaseTabs.Tab>
                <button
                  type="button"
                  className={closeStyles}
                  aria-label={closeLabel(tab.label)}
                  // One Tab stop per strip: the open note and its close.
                  tabIndex={selected ? 0 : -1}
                  onClick={() => close(tab.id)}
                >
                  <X weight="bold" aria-hidden />
                </button>
              </span>
            );
          })}
        </BaseTabs.List>
        {onAdd && (
          <IconButton
            ref={addRef}
            label={addLabel}
            size="sm"
            className={addStyles}
            onClick={onAdd}
          >
            <Plus />
          </IconButton>
        )}
      </div>
      {children}
    </BaseTabs.Root>
  );
}

export interface NoteTabPanelProps
  extends Omit<ComponentProps<typeof BaseTabs.Panel>, "className"> {
  className?: string;
}

/**
 * A note's content, shown while its tab is open. It fills the rest of the
 * column and scrolls.
 */
export const NoteTabPanel = forwardRef<HTMLDivElement, NoteTabPanelProps>(
  function NoteTabPanel(props, ref) {
    const { className, ...rest } = props;
    return (
      <BaseTabs.Panel
        ref={ref}
        className={cx(panelStyles, className)}
        {...rest}
      />
    );
  },
);
