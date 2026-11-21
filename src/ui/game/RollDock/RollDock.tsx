import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { CSSProperties, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { css, cx } from "styled-system/css";

import { Button } from "../../components/Button";
import { CssProp, withCssProp } from "../../styles/cssProp";
import { DockedCard } from "./DockedCard";
import type { DockedItem } from "./DockedCard";
import { RecentRollsSheet } from "./RecentRollsSheet";

/** How far each older card's edge shows above the one in front of it. */
const PEEK_OFFSET = 6;
/** How many older cards peek out behind the newest. */
const MAX_PEEKING = 2;

const dockStyles = css({
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "2",
  width: "100%",
  // The page under the gaps stays usable; the cards and buttons take taps.
  pointerEvents: "none",
  "& > *": { pointerEvents: "auto" },
});

const handleStyles = css({
  marginBlockEnd: "var(--peek-space)",
});

const stackStyles = css({
  position: "relative",
  width: "100%",
  isolation: "isolate",
});

/** The older cards' edges: drawn only, with nothing to read. */
const peekStyles = css({
  position: "absolute",
  zIndex: -1,
  top: "calc(var(--depth) * -1 * 6px)",
  bottom: "calc(var(--depth) * 6px)",
  insetInline: "calc(var(--depth) * 8px)",
  borderRadius: "lg",
  border: "1px solid token(colors.border.control)",
  background: "bg.muted",
  boxShadow: "popover",
  "&[data-depth='2']": { zIndex: -2, background: "bg.emphasized" },
});

/** Long results fold under Show all, so the stack never fills the screen. */
const clampStyles = css({
  position: "relative",
  "&[data-clamped]": {
    maxHeight: "var(--roll-clamp)",
    overflow: "hidden",
    borderRadius: "lg",
  },
});

const cardStyles = css({ maxWidth: "none!" });

const showAllRowStyles = css({
  display: "flex",
  justifyContent: "flex-end",
  marginBlockStart: "-1",
});

export interface RollDockProps extends CssProp {
  /**
   * Recent rolls and notifications, oldest first; the newest shows in full.
   */
  items: DockedItem[];
  onDismiss: (id: string) => void;
  /** Dismisses every item. The sheet closes with it. */
  onClearAll: () => void;
  /** The tallest the newest card shows before Show all, 240px. */
  clampHeight?: number;
  /** Names the region and the sheet, "Notifications". */
  label?: string;
  /** The handle, "3 notifications". */
  countLabel?: (count: number) => string;
  showAllLabel?: string;
  showLessLabel?: string;
  clearAllLabel?: string;
  emptyLabel?: string;
  className?: string;
}

/**
 * Recent rolls and notifications on phones, docked above the bottom nav,
 * the phone's version of the Toaster's one stack: the newest card in full
 * (a roll card or a toast), the edges of up to two older ones behind it,
 * and an "N notifications" handle that opens them all in a sheet (per-card
 * Dismiss and Clear all). Cards dismiss only through their named button.
 * Place it over the page's foot, above the MobileNav, at the page's full
 * width less 16px each side.
 */
export function RollDock(props: RollDockProps) {
  const { t } = useTranslation();
  const {
    items,
    onDismiss,
    onClearAll,
    clampHeight = 240,
    label = t("ui.roll-dock.notifications", "Notifications"),
    countLabel = (count: number) =>
      t("ui.roll-dock.count", "{{count}} notifications", {
        count,
        defaultValue_one: "{{count}} notification",
      }),
    showAllLabel = t("ui.roll-dock.show-all", "Show all"),
    showLessLabel = t("ui.roll-dock.show-less", "Show less"),
    clearAllLabel = t("ui.roll-dock.clear-all", "Clear all"),
    emptyLabel = t("ui.roll-dock.empty", "No notifications"),
    className,
  } = withCssProp(props);

  const [sheetOpen, setSheetOpen] = useState(false);
  const newest = items[items.length - 1];
  const peeking = Math.min(items.length - 1, MAX_PEEKING);

  // Whether the newest card is taller than the clamp, and whether it's open.
  const contentRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expanded = !!newest && expandedId === newest.id;
  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const measure = () => setOverflows(element.scrollHeight > clampHeight + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element.firstElementChild ?? element);
    return () => observer.disconnect();
  }, [newest, clampHeight]);

  if (items.length === 0) return null;

  return (
    <>
      <section
        aria-label={label}
        className={cx(dockStyles, className)}
        style={
          {
            "--peek-space": `${PEEK_OFFSET * peeking + 4}px`,
            "--roll-clamp": `${clampHeight}px`,
          } as CSSProperties
        }
      >
        {items.length > 1 && (
          <Button
            size="sm"
            variant="outline"
            startIcon={<ClockCounterClockwiseIcon />}
            aria-haspopup="dialog"
            onClick={() => setSheetOpen(true)}
            className={handleStyles}
          >
            {countLabel(items.length)}
          </Button>
        )}
        {newest && (
          <div className={stackStyles}>
            {Array.from({ length: peeking }, (_, index) => (
              <span
                key={index}
                aria-hidden
                className={peekStyles}
                data-depth={index + 1}
                style={{ "--depth": index + 1 } as CSSProperties}
              />
            ))}
            <div
              ref={contentRef}
              className={clampStyles}
              data-clamped={overflows && !expanded ? "" : undefined}
            >
              <DockedCard
                key={newest.id}
                item={newest}
                docked
                onDismiss={() => onDismiss(newest.id)}
                className={cardStyles}
              />
            </div>
            {overflows && (
              <div className={showAllRowStyles}>
                <Button
                  size="sm"
                  variant="text"
                  aria-expanded={expanded}
                  onClick={() => setExpandedId(expanded ? null : newest.id)}
                >
                  {expanded ? showLessLabel : showAllLabel}
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
      <RecentRollsSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        items={items}
        onDismiss={onDismiss}
        onClearAll={() => {
          onClearAll();
          setSheetOpen(false);
        }}
        title={label}
        clearAllLabel={clearAllLabel}
        emptyLabel={emptyLabel}
      />
    </>
  );
}
