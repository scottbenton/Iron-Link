import { Collapsible } from "@base-ui/react/collapsible";
import { CaretRightIcon } from "@phosphor-icons/react";
import { ElementType, ReactNode, useContext } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";
import { focusRing } from "ui/styles/focus";
import { overlayTint } from "ui/styles/pressable";

import { css, cva, cx } from "styled-system/css";

import { collapsiblePanelStyles } from "../../components/Collapsible/collapsibleStyles";
import { VisuallyHidden } from "../../components/VisuallyHidden";
import { CategoryContext, HeadingLevel } from "./categoryContext";

const rootStyles = css({
  display: "grid",
  minWidth: 0,
  margin: 0,
  padding: 0,
});

const headingStyles = css({
  margin: 0,
  padding: 0,
  font: "inherit",
});

/**
 * The trigger fills its heading. Three steps: the top level is the sheet's
 * muted band; one level down a plain row with a bold sentence-case name; any
 * deeper a small uppercase label. The caret leads, so a category never reads
 * as a move row (whose chevron sits at the end); the count trails.
 */
const triggerStyles = cva({
  base: {
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "2",
    width: "100%",
    margin: 0,
    paddingInline: "3",
    border: 0,
    borderRadius: "md",
    background: "transparent",
    color: "fg.default",
    fontFamily: "heading",
    fontWeight: "bold",
    lineHeight: "tight",
    textAlign: "start",
    cursor: "pointer",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    outline: "none",
    transition: "background-color token(durations.fast) linear",
    // An overlay layered over the fill, so the band keeps its colour under it.
    _hoverable: {
      "&:hover:not(:disabled, [data-disabled], :active, [data-pressed])": {
        ...overlayTint("token(colors.overlay.hover)"),
      },
    },
    _pressed: {
      ...overlayTint("token(colors.overlay.pressed)"),
    },
    _focusVisible: focusRing.inset,
    // Disabled, the header takes no pointer at all: no hover, no press.
    "&:is(:disabled, [data-disabled])": {
      pointerEvents: "none",
      color: "fg.disabled",
      "& [data-caret], & [data-count]": { color: "fg.disabled" },
    },
    _touch: { minHeight: "touch" },
    "& [data-caret]": {
      flex: "none",
      width: "16px",
      height: "16px",
      color: "fg.muted",
      transition: "rotate token(durations.normal) token(easings.out)",
      _reducedMotion: { transition: "none" },
    },
    "&[data-panel-open] [data-caret]": { rotate: "90deg" },
    "& [data-title]": {
      flex: "1",
      minWidth: 0,
      overflowWrap: "anywhere",
      textWrap: "balance",
    },
    "& [data-count]": {
      flex: "none",
      fontFamily: "body",
      fontSize: "xs",
      fontWeight: "medium",
      letterSpacing: "normal",
      textTransform: "none",
      color: "fg.muted",
      fontVariantNumeric: "tabular-nums",
    },
  },
  variants: {
    step: {
      band: {
        minHeight: "control.md",
        paddingBlock: "1",
        background: "bg.emphasized",
        fontSize: "md",
        textTransform: "uppercase",
        letterSpacing: "label",
        color: "fg.muted",
      },
      sub: {
        minHeight: "control.row",
        paddingBlock: "1.5",
        fontSize: "md",
      },
      deep: {
        minHeight: "control.sm",
        paddingBlock: "1",
        fontSize: "sm",
        textTransform: "uppercase",
        letterSpacing: "label",
        color: "fg.muted",
      },
    },
  },
});

/**
 * The open contents. Under the band they run flush; a nested category's
 * contents hang from a rule under its caret, so each level steps in 24px
 * and a row's name lines up with its category's name.
 */
const contentStyles = cva({
  base: {
    display: "grid",
    gap: "0.5",
    minWidth: 0,
  },
  variants: {
    nested: {
      false: { paddingBlock: "1" },
      true: {
        // The caret's centre: 12px padding plus half its 16px width.
        marginInlineStart: "calc(token(spacing.3) + 7.5px)",
        paddingInlineStart: "calc(token(spacing.1) - 0.5px)",
        marginBlockEnd: "1",
        borderInlineStart: "1px solid token(colors.border.subtle)",
      },
    },
  },
});

export interface ReferenceCategoryProps extends CssProp {
  /** The category's name, such as "Planet Oracles" or "Desert World". */
  title: ReactNode;
  /** How many moves or oracles it holds, shown after the name. */
  count?: number;
  /** What a screen reader hears after the name, from the count. */
  countLabel?: (count: number) => string;
  open?: boolean;
  /** Closed by default, as in the live app's trees. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * The heading level of a top-level category, 3 by default (in a column
   * under its h2). Nested categories take the next level down by
   * themselves, to h6 at most.
   */
  headingLevel?: HeadingLevel;
  disabled?: boolean;
  /** Rows (`MoveListItem`, `OracleListItem`) and nested categories. */
  children: ReactNode;
  /** The wrapper element; `li` inside a list. */
  as?: ElementType;
  className?: string;
}

const defaultCountLabel = (count: number) =>
  count === 1 ? "1 item" : `${count} items`;

/**
 * A move or oracle category that opens and closes, at any depth: nest one
 * inside another's children and it steps down by itself (a smaller heading,
 * its contents indented on a rule). The name is a heading holding the
 * disclosure button, so heading navigation still finds every category.
 */
export function ReferenceCategory(props: ReferenceCategoryProps) {
  const {
    title,
    count,
    countLabel = defaultCountLabel,
    open,
    defaultOpen = false,
    onOpenChange,
    headingLevel: headingLevelProp,
    disabled,
    children,
    as: Wrapper = "section",
    className,
  } = withCssProp(props);

  const parent = useContext(CategoryContext);
  const depth = parent ? parent.depth + 1 : 0;
  const headingLevel = headingLevelProp ?? parent?.headingLevel ?? 3;
  const Heading = `h${headingLevel}` as const;
  const step = depth === 0 ? "band" : depth === 1 ? "sub" : "deep";

  return (
    <Collapsible.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(next) => onOpenChange?.(next)}
      disabled={disabled}
      render={<Wrapper />}
      className={cx(rootStyles, className)}
      data-depth={depth}
    >
      <Heading className={headingStyles}>
        <Collapsible.Trigger className={triggerStyles({ step })}>
          <CaretRightIcon data-caret="" weight="bold" aria-hidden />
          <span data-title="">{title}</span>
          {count !== undefined && (
            <>
              <span data-count="" aria-hidden>
                {count}
              </span>
              <VisuallyHidden>, {countLabel(count)}</VisuallyHidden>
            </>
          )}
        </Collapsible.Trigger>
      </Heading>
      <Collapsible.Panel className={collapsiblePanelStyles}>
        <div className={contentStyles({ nested: depth > 0 })}>
          <CategoryContext.Provider
            value={{
              depth,
              headingLevel: Math.min(headingLevel + 1, 6) as HeadingLevel,
            }}
          >
            {children}
          </CategoryContext.Provider>
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
