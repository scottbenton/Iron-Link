import { CaretDownIcon } from "@phosphor-icons/react";
import { ReactNode, useId, useState } from "react";

import { css } from "styled-system/css";

import { Collapse } from "../../components/Collapsible";

/** Fewer items than this start open, as in the live app. */
const OPEN_BELOW = 3;

const headingStyles = css({ margin: 0 });

/** A band like SectionHeading's, all of it the toggle. */
const toggleStyles = css({
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  gap: "2",
  width: "100%",
  minHeight: "40px",
  margin: 0,
  paddingInline: "3",
  paddingBlock: "1",
  borderWidth: 0,
  borderRadius: "md",
  background: "bg.emphasized",
  color: "fg.muted",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "md",
  lineHeight: "tight",
  textTransform: "uppercase",
  letterSpacing: "label",
  textAlign: "start",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  outline: "none",
  transitionProperty: "box-shadow, color",
  transitionDuration: "fast",
  transitionTimingFunction: "linear",
  _hover: {
    color: "fg.default",
    boxShadow: "inset 0 0 0 999px token(colors.overlay.hover)",
  },
  _pressed: { boxShadow: "inset 0 0 0 999px token(colors.overlay.pressed)" },
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "2px",
  },
  _touch: { minHeight: "touch" },
  "& [data-count]": {
    fontVariantNumeric: "tabular-nums",
    color: "fg.subtle",
  },
  "& [data-caret]": {
    flex: "none",
    marginInlineStart: "auto",
    width: "16px",
    height: "16px",
    transitionProperty: "transform",
    transitionDuration: "normal",
    transitionTimingFunction: "out",
    _reducedMotion: { transition: "none" },
  },
  "&[aria-expanded=true] [data-caret]": { transform: "rotate(180deg)" },
});

const controlsStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "2",
  paddingBlockStart: "2",
});

const bodyStyles = css({
  display: "grid",
  gap: "3",
  paddingBlockStart: "3",
});

export interface TracksPanelSectionProps {
  title: string;
  headingAs: "h2" | "h3" | "h4";
  /** Items it holds, shown beside the title. Under 3 starts it open. */
  count: number;
  /** Filters and Add, folded away with the list. */
  controls?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A section under the tracks (Connections, Bonds): a band that opens and
 * closes it, its controls and its list. It starts open only with few items,
 * so a long list of connections doesn't push everything else away.
 */
export function TracksPanelSection(props: TracksPanelSectionProps) {
  const {
    title,
    headingAs: Heading,
    count,
    controls,
    children,
    className,
  } = props;
  const [open, setOpen] = useState(() => count < OPEN_BELOW);
  const panelId = useId();

  return (
    <section className={className}>
      <Heading className={headingStyles}>
        <button
          type="button"
          className={toggleStyles}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          {title} <span data-count="">{count}</span>
          <CaretDownIcon data-caret="" weight="bold" aria-hidden />
        </button>
      </Heading>
      <Collapse open={open} id={panelId} keepMounted>
        {controls && <div className={controlsStyles}>{controls}</div>}
        <div className={bodyStyles}>{children}</div>
      </Collapse>
    </section>
  );
}
