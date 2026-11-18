import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { CheckCircle } from "@phosphor-icons/react";
import { CSSProperties } from "react";

import { SchemeName, ringGradient, schemeNames, schemes } from "ui/theme";

import { css, cx } from "styled-system/css";

const groupStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 148px), 1fr))",
  gap: "2",
});

const optionStyles = css({
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: "3",
  minHeight: "52px",
  paddingBlock: "2",
  paddingInlineStart: "3",
  paddingInlineEnd: "8",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "md",
  background: "bg.surface",
  color: "fg.default",
  fontFamily: "heading",
  fontWeight: "semibold",
  fontSize: "md",
  letterSpacing: "0.01em",
  cursor: "pointer",
  userSelect: "none",
  WebkitTapHighlightColor: "transparent",
  outline: "none",
  transitionProperty: "border-color, background-color, box-shadow",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  _hover: { background: "bg.muted", borderColor: "border.control" },
  _pressed: { background: "bg.emphasized" },
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "2px",
  },
  "&[data-checked]": {
    borderColor: "fg.default",
    boxShadow: "inset 0 0 0 1px token(colors.fg.default)",
    background: "bg.surface",
  },
  "&:is([data-disabled])": { cursor: "not-allowed", opacity: 0.6 },
  "& [data-swatch]": {
    flex: "none",
    display: "grid",
    placeItems: "center",
    width: "36px",
    height: "36px",
    padding: "3px",
    borderRadius: "md",
    background: "var(--swatch-ring)",
    boxShadow: "0 var(--border-widths-ledge) 0 rgb(0 0 0 / 0.18)",
  },
  // A tiny roll button: the dark chip inside the ring.
  "& [data-swatch] > span": {
    width: "100%",
    height: "100%",
    borderRadius: "calc(token(radii.md) - 3px)",
    background: "bg.chip",
  },
  "& [data-check]": {
    position: "absolute",
    insetInlineEnd: "2",
    top: "50%",
    translate: "0 -50%",
    width: "20px",
    height: "20px",
    color: "fg.default",
    opacity: 0,
    scale: "0.6",
    transitionProperty: "opacity, scale",
    transitionDuration: "normal",
    transitionTimingFunction: "out",
    _reducedMotion: { scale: "1" },
  },
  "&[data-checked] [data-check]": { opacity: 1, scale: "1" },
  _touch: { minHeight: "touch" },
});

export interface ColorSchemePickerProps {
  value: SchemeName;
  onValueChange: (scheme: SchemeName) => void;
  /** Names for each scheme, for translation. Defaults to the scheme's label. */
  labels?: Partial<Record<SchemeName, string>>;
  /** Which schemes to offer, in order. All nine by default. */
  options?: SchemeName[];
  disabled?: boolean;
  /** The group's accessible name. */
  "aria-label"?: string;
  /** Or the id of a visible label. */
  "aria-labelledby"?: string;
  className?: string;
}

/**
 * Iron Link's colour schemes as a radio group. Each swatch shows the
 * scheme's ring gradient around a dark chip, like its roll buttons.
 */
export function ColorSchemePicker(props: ColorSchemePickerProps) {
  const {
    value,
    onValueChange,
    labels,
    options = schemeNames,
    disabled,
    className,
    ...aria
  } = props;

  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => onValueChange(next as SchemeName)}
      disabled={disabled}
      className={cx(groupStyles, className)}
      aria-label={
        aria["aria-labelledby"]
          ? undefined
          : (aria["aria-label"] ?? "Colour scheme")
      }
      aria-labelledby={aria["aria-labelledby"]}
    >
      {options.map((name) => (
        <Radio.Root
          key={name}
          value={name}
          className={optionStyles}
          style={
            { "--swatch-ring": ringGradient(schemes[name]) } as CSSProperties
          }
        >
          <span data-swatch="" aria-hidden>
            <span />
          </span>
          {labels?.[name] ?? schemes[name].label}
          <CheckCircle data-check="" weight="fill" aria-hidden />
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
