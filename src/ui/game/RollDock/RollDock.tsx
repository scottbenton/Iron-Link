import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import {
  CSSProperties,
  ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { css, cx } from "styled-system/css";

import { Button } from "../../components/Button";
import { LayoutProps, withLayoutProps } from "../../styles/layoutProps";
import { RollCard } from "../RollCard";
import type { RollData } from "../RollCard";
import { RecentRollsSheet } from "./RecentRollsSheet";

/** How far each older card's edge shows above the one in front of it. */
const PEEK_OFFSET = 6;
/** How many older cards peek out behind the newest. */
const MAX_PEEKING = 2;

export interface DockedRoll {
  id: string;
  roll: RollData;
}

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

export interface RollDockProps extends LayoutProps {
  /** Recent rolls, oldest first; the newest shows in full. */
  rolls: DockedRoll[];
  onDismiss: (id: string) => void;
  /** Dismisses every roll. The Recent rolls sheet closes with it. */
  onClearAll: () => void;
  /**
   * A snackbar to show above the rolls, so the two stack rather than
   * overlap (`ToastCard`). The app's Toaster docks the same way.
   */
  notice?: ReactNode;
  /** The tallest the newest card shows before Show all, 240px. */
  clampHeight?: number;
  /** Names the region, "Recent rolls". */
  label?: string;
  /** The handle, "3 rolls". */
  countLabel?: (count: number) => string;
  showAllLabel?: string;
  showLessLabel?: string;
  clearAllLabel?: string;
  emptyLabel?: string;
  className?: string;
}

/**
 * Recent rolls on phones, docked above the bottom nav: the newest roll card
 * in full, the edges of up to two older ones behind it, and an "N rolls"
 * handle that opens every recent roll in a sheet (per-card Dismiss and
 * Clear all). A snackbar stacks above it. Cards dismiss only through their
 * named button. Place it over the page's foot, above the MobileNav, at the
 * page's full width less 16px each side.
 */
export function RollDock(props: RollDockProps) {
  const {
    rolls,
    onDismiss,
    onClearAll,
    notice,
    clampHeight = 240,
    label = "Recent rolls",
    countLabel = (count: number) => `${count} rolls`,
    showAllLabel = "Show all",
    showLessLabel = "Show less",
    clearAllLabel = "Clear all",
    emptyLabel = "No recent rolls",
    className,
  } = withLayoutProps(props);

  const [sheetOpen, setSheetOpen] = useState(false);
  const newest = rolls[rolls.length - 1];
  const peeking = Math.min(rolls.length - 1, MAX_PEEKING);

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

  const hasRolls = rolls.length > 0;
  if (!hasRolls && !notice) return null;

  return (
    <>
      <section
        aria-label={hasRolls ? label : undefined}
        className={cx(dockStyles, className)}
        style={
          {
            "--peek-space": `${PEEK_OFFSET * peeking + 4}px`,
            "--roll-clamp": `${clampHeight}px`,
          } as CSSProperties
        }
      >
        {notice}
        {rolls.length > 1 && (
          <Button
            size="sm"
            variant="outline"
            startIcon={<ClockCounterClockwiseIcon />}
            aria-haspopup="dialog"
            onClick={() => setSheetOpen(true)}
            className={handleStyles}
          >
            {countLabel(rolls.length)}
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
              <RollCard
                key={newest.id}
                roll={newest.roll}
                elevated
                animateIn
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
        rolls={rolls}
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
