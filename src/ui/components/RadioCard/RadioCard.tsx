import { Radio as BaseRadio } from "@base-ui/react/radio";
import { CheckCircle } from "@phosphor-icons/react";
import { ReactNode, Ref, useId } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";
import { focusRing } from "ui/styles/focus";
import { ledgeHeight, ledgeLayers } from "ui/styles/ledge";

import { css, cx } from "styled-system/css";

const cardStyles = css({
  boxSizing: "border-box",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  borderWidth: "1px",
  borderStyle: "solid",
  borderRadius: "lg",
  ...ledgeLayers("token(radii.lg)"),
  "--ledge-face": "{colors.bg.surface}",
  "--ledge-border": "{colors.border.default}",
  "--ledge-edge": "{colors.border.edge}",
  color: "fg.default",
  transform: "translateY(0)",
  transitionProperty: "transform",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  _hoverable: {
    "&:hover:not([data-checked], [data-disabled])": {
      "--ledge-face": "{colors.bg.muted}",
      "--ledge-border": "{colors.border.control}",
    },
  },
  // Pressing the card sinks it onto its ledge, like a button.
  "&:has(> [role=radio]:active):not([data-disabled])": {
    "--ledge-height": ledgeHeight.sunk,
    transform: "translateY(var(--spacing-sink))",
    transitionDuration: "instant",
  },
  "&:has(> [role=radio]:focus-visible)": focusRing.outset,
  // Chosen: accent border thickened to 2px by an inset ring, so the border
  // width (and the layout) never changes.
  "&[data-checked]": {
    "--ledge-face": "{colors.accent.soft}",
    "--ledge-border": "{colors.accent.solid}",
    "--ledge-edge": "{colors.accent.edge}",
    "--ledge-inset": "inset 0 0 0 1px {colors.accent.solid}",
  },
  "&[data-disabled]": {
    "--ledge-face": "{colors.bg.muted}",
    "--ledge-border": "{colors.border.subtle}",
    "--ledge-edge": "transparent",
    color: "fg.subtle",
  },
});

const areaStyles = css({
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: "1",
  flex: "1 1 auto",
  padding: "4",
  borderRadius: "inherit",
  cursor: "pointer",
  outline: "none",
  textAlign: "start",
  WebkitTapHighlightColor: "transparent",
  "&[data-disabled]": { cursor: "not-allowed" },
  "&[data-readonly]": { cursor: "default" },
  "[data-size=sm] > &": { padding: "3" },
});

const headStyles = css({
  display: "flex",
  alignItems: "flex-start",
  gap: "2",
});

const titleRowStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  flex: "1 1 auto",
  minWidth: 0,
});

const iconStyles = css({
  display: "grid",
  placeItems: "center",
  flex: "none",
  width: "40px",
  height: "40px",
  borderRadius: "md",
  background: "bg.emphasized",
  color: "fg.default",
  "& > svg": { width: "22px", height: "22px" },
  "[data-checked] &": { background: "accent.solid", color: "accent.onSolid" },
  "[data-disabled] &": { background: "bg.emphasized", color: "fg.disabled" },
  // Unframed: the icon is a picture in its own right (a logo, a swatch).
  "&[data-frame=none]": {
    background: "transparent",
    "& > svg": { width: "100%", height: "100%" },
    "[data-checked] &": { background: "transparent" },
    "[data-disabled] &": { background: "transparent", opacity: 0.6 },
  },
});

const titleStyles = css({
  margin: 0,
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "lg",
  lineHeight: "tight",
  textTransform: "uppercase",
  letterSpacing: "0.02em",
  overflowWrap: "anywhere",
  "[data-size=sm] &": { fontSize: "md" },
});

/** The check's slot is always kept, so choosing a card never moves its text. */
const checkStyles = css({
  display: "inline-flex",
  flex: "none",
  width: "24px",
  height: "24px",
  color: "accent.fg",
  opacity: 0,
  scale: "0.6",
  transitionProperty: "opacity, scale",
  transitionDuration: "fast",
  transitionTimingFunction: "in",
  "& > svg": { width: "icon.lg", height: "icon.lg" },
  "[data-checked] &": {
    opacity: 1,
    scale: "1",
    transitionDuration: "normal",
    transitionTimingFunction: "out",
  },
  _reducedMotion: { scale: "1!" },
});

const descriptionStyles = css({
  margin: 0,
  fontSize: "sm",
  lineHeight: "normal",
  color: "fg.muted",
  "[data-disabled] &": { color: "fg.subtle" },
});

const footerStyles = css({
  paddingInline: "4",
  paddingBottom: "4",
  marginTop: "-1",
});

export interface RadioCardProps<V = string> extends CssProp {
  /** What choosing this card sets the group to. */
  value: V;
  /** The card's name, in the heading face. */
  title: ReactNode;
  /** A line or two on what the choice means. */
  description?: ReactNode;
  /** An icon shown in a tile before the title. */
  icon?: ReactNode;
  /**
   * `none` drops the tile behind the icon, for a picture that is its own
   * shape, such as a scheme's logo.
   */
  iconFrame?: "tile" | "none";
  /** `sm` for a grid of short choices: less padding, a smaller title. */
  size?: "md" | "sm";
  disabled?: boolean;
  /** Ids of more text that describes the card, such as why it is disabled. */
  describedBy?: string[];
  /** Extra content inside the card's selectable area, under the description. */
  children?: ReactNode;
  /**
   * Content below the selectable area, outside the radio, so it may hold its
   * own buttons or links.
   */
  footer?: ReactNode;
  className?: string;
  ref?: Ref<HTMLElement>;
}

/** One card in a RadioCardGroup. */
export function RadioCard<V = string>(props: RadioCardProps<V>) {
  const {
    value,
    title,
    description,
    icon,
    iconFrame = "tile",
    size = "md",
    disabled,
    describedBy = [],
    children,
    footer,
    className,
    ref,
  } = withCssProp(props);
  const titleId = useId();
  const descriptionId = useId();
  const describedByIds = [
    ...(description ? [descriptionId] : []),
    ...describedBy,
  ];

  return (
    <BaseRadio.Root
      ref={ref}
      value={value}
      disabled={disabled}
      aria-labelledby={titleId}
      aria-describedby={
        describedByIds.length ? describedByIds.join(" ") : undefined
      }
      className={areaStyles}
      render={(radioProps, state) => (
        <div
          className={cx(cardStyles, className)}
          data-checked={state.checked ? "" : undefined}
          data-disabled={state.disabled ? "" : undefined}
          data-size={size}
        >
          <div {...radioProps}>
            <div className={headStyles}>
              <div className={titleRowStyles}>
                {icon && (
                  <span
                    className={iconStyles}
                    data-frame={iconFrame}
                    aria-hidden
                  >
                    {icon}
                  </span>
                )}
                <span id={titleId} className={titleStyles}>
                  {title}
                </span>
              </div>
              <span className={checkStyles} data-part="check" aria-hidden>
                <CheckCircle weight="fill" />
              </span>
            </div>
            {description && (
              <div id={descriptionId} className={descriptionStyles}>
                {description}
              </div>
            )}
            {children}
          </div>
          {footer && <div className={footerStyles}>{footer}</div>}
        </div>
      )}
    />
  );
}
