import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { CheckCircle } from "@phosphor-icons/react";
import { CSSProperties, ReactNode, Ref, useId } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";
import { ledge, ledgeShadow } from "ui/styles/ledge";

import { css, cx } from "styled-system/css";

import {
  FieldDescription,
  FieldError,
  FieldOwnProps,
  FieldRoot,
  FieldsetLegend,
  fieldsetDescriptionStyles,
  resolveFieldError,
} from "../Field";

export interface RadioCardGroupProps<V = string>
  extends FieldOwnProps,
    LayoutProps {
  /** The RadioCards. */
  children: ReactNode;
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  /**
   * Cards per row from the `sm` breakpoint up; they stack below it. Leave it
   * out to fit as many as `minCardWidth` allows.
   */
  columns?: number;
  /** The narrowest a card gets when `columns` is not set. */
  minCardWidth?: string;
  name?: string;
  readOnly?: boolean;
  /** Names the group when there is no visible legend. */
  "aria-label"?: string;
  className?: string;
  /** Class for the grid of cards. */
  gridClassName?: string;
}

const groupStyles = css({
  boxSizing: "border-box",
  display: "grid",
  gap: "2",
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: 0,
});

const gridStyles = css({
  display: "grid",
  gap: "3",
  gridTemplateColumns:
    "repeat(auto-fill, minmax(min(100%, var(--radio-card-min, 200px)), 1fr))",
  // Room for the cards' ledge under the last row.
  paddingBottom: "0.5",
  "&[data-columns]": {
    gridTemplateColumns: "minmax(0, 1fr)",
    sm: {
      gridTemplateColumns: "repeat(var(--radio-card-columns), minmax(0, 1fr))",
    },
  },
});

/**
 * A radio group of large cards, each with a title, a description and an
 * optional icon: choosing a ruleset or a game type. Arrow keys move the
 * choice; Tab reaches only the chosen card.
 */
export function RadioCardGroup<V = string>(props: RadioCardGroupProps<V>) {
  const {
    children,
    value,
    defaultValue,
    onValueChange,
    columns,
    minCardWidth,
    name,
    readOnly,
    "aria-label": ariaLabel,
    className,
    gridClassName,
    label,
    hideLabel,
    description,
    error,
    invalid: invalidProp,
    required,
    disabled,
    requiredIndicator,
  } = withLayoutProps(props);
  const { invalid, message } = resolveFieldError(error, invalidProp);

  const gridStyle = {
    ...(columns ? { "--radio-card-columns": columns } : {}),
    ...(minCardWidth ? { "--radio-card-min": minCardWidth } : {}),
  } as CSSProperties;

  return (
    <FieldRoot
      className={className}
      name={name}
      invalid={invalid || undefined}
      disabled={disabled}
    >
      <BaseFieldset.Root
        className={groupStyles}
        aria-label={ariaLabel}
        render={
          <BaseRadioGroup<V>
            value={value}
            defaultValue={defaultValue}
            onValueChange={(next) => onValueChange?.(next)}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            name={name}
          />
        }
      >
        {label !== undefined && label !== null && (
          <FieldsetLegend
            hidden={hideLabel}
            required={required}
            requiredIndicator={requiredIndicator}
          >
            {label}
          </FieldsetLegend>
        )}
        {description !== undefined && description !== null && (
          <FieldDescription className={fieldsetDescriptionStyles}>
            {description}
          </FieldDescription>
        )}
        <div
          className={cx(gridStyles, gridClassName)}
          data-columns={columns ? "" : undefined}
          style={gridStyle}
        >
          {children}
        </div>
      </BaseFieldset.Root>
      <FieldError>{message}</FieldError>
    </FieldRoot>
  );
}

const cardStyles = css({
  boxSizing: "border-box",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "lg",
  background: "bg.surface",
  color: "fg.default",
  ...ledge("token(colors.border.edge)", "rest"),
  transitionProperty: "transform, box-shadow, background-color, border-color",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  _hoverable: {
    "&:hover:not([data-checked], [data-disabled])": {
      background: "bg.muted",
      borderColor: "border.control",
    },
  },
  // Pressing the card sinks it onto its ledge, like a button.
  "&:has(> [role=radio]:active):not([data-disabled])": {
    ...ledge("token(colors.border.edge)", "sunk"),
    transitionDuration: "instant",
  },
  "&:has(> [role=radio]:focus-visible)": {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "2px",
  },
  // Chosen: accent border thickened to 2px by an inset ring, so the border
  // width (and the layout) never changes.
  "&[data-checked]": {
    borderColor: "accent.solid",
    background: "accent.soft",
    boxShadow: `inset 0 0 0 1px token(colors.accent.solid), ${ledgeShadow("token(colors.accent.edge)")}`,
  },
  "&[data-checked]:has(> [role=radio]:active)": {
    boxShadow: `inset 0 0 0 1px token(colors.accent.solid), ${ledgeShadow("token(colors.accent.edge)", "sunk")}`,
  },
  "&[data-disabled]": {
    background: "bg.muted",
    borderColor: "border.subtle",
    boxShadow: "none",
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
  "& > svg": { width: "24px", height: "24px" },
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

export interface RadioCardProps<V = string> extends LayoutProps {
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
  } = withLayoutProps(props);
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
              <span className={checkStyles} aria-hidden>
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
