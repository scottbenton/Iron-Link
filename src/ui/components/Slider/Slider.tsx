import { Slider as BaseSlider } from "@base-ui/react/slider";
import { ReactNode, Ref } from "react";

import { focusRing } from "ui/styles/focus";
import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";
import { ledgeLayers } from "ui/styles/ledge";

import { css } from "styled-system/css";

import { FieldOwnProps, FieldShell, fieldRootStyles } from "../Field";

type SliderValue = number | readonly number[];

export interface SliderProps<V extends SliderValue = number>
  extends FieldOwnProps,
    LayoutProps {
  /**
   * The value, when controlled. Pass an array of two numbers for a range
   * with two thumbs.
   */
  value?: V;
  defaultValue?: V;
  /** Called on every move, while dragging too. */
  onValueChange?: (value: V) => void;
  /** Called once a move settles: on release, or after a key press. */
  onValueCommitted?: (value: V) => void;
  /** Default 0. */
  min?: number;
  /** Default 100. */
  max?: number;
  /** Default 1. */
  step?: number;
  /** The step of Page Up, Page Down and Shift with an arrow. Default 10. */
  largeStep?: number;
  /** How the value is shown and read out, such as a percent or a unit. */
  format?: Intl.NumberFormatOptions;
  /** Show the value at the end of the label row. */
  showValue?: boolean;
  /**
   * What a screen reader hears for a value, such as "3 of 5 segments"
   * rather than "3".
   */
  getAriaValueText?: (
    formattedValue: string,
    value: number,
    index: number,
  ) => string;
  /** Names each thumb when there is no visible label, or for a range. */
  getThumbLabel?: (index: number) => string;
  /** Marks under the track, such as named points of a scale. */
  marks?: { value: number; label: ReactNode }[];
  name?: string;
  /** Names the slider when there is no visible label. */
  "aria-label"?: string;
  id?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

const controlStyles = css({
  boxSizing: "border-box",
  position: "relative",
  display: "flex",
  alignItems: "center",
  width: "100%",
  height: "24px",
  touchAction: "none",
  userSelect: "none",
  cursor: "pointer",
  "&[data-disabled]": { cursor: "not-allowed" },
  _touch: { height: "touch" },
});

/** The track is an inset well like a field. */
const trackStyles = css({
  position: "relative",
  width: "100%",
  height: "6px",
  borderRadius: "full",
  background: "bg.emphasized",
  boxShadow: "field",
  outline: "1px solid token(colors.border.control)",
  outlineOffset: "-1px",
  "[data-disabled] &": {
    background: "bg.muted",
    outlineColor: "border.default",
  },
});

const indicatorStyles = css({
  borderRadius: "inherit",
  background: "accent.solid",
  height: "100%",
  "[data-disabled] &": { background: "fg.disabled" },
});

/**
 * The thumb is a small button with a ledge, so it reads as something to
 * grab. Base UI places it with `translate`, so only `scale` moves it.
 */
const thumbStyles = css({
  boxSizing: "border-box",
  width: "18px",
  height: "18px",
  borderRadius: "full",
  borderWidth: "1px",
  borderStyle: "solid",
  // A round thumb's corners are its whole lower half.
  ...ledgeLayers("50%"),
  "--ledge-face": "{colors.bg.surface}",
  "--ledge-border": "{colors.accent.solid}",
  "--ledge-edge": "{colors.accent.edge}",
  cursor: "grab",
  transitionProperty: "scale",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  outline: "none",
  "&:has(:focus-visible)": focusRing.outset,
  "&[data-dragging]": {
    cursor: "grabbing",
    scale: "0.92",
    "--ledge-height": "0px",
  },
  "&[data-disabled]": {
    cursor: "not-allowed",
    "--ledge-face": "{colors.bg.muted}",
    "--ledge-border": "{colors.border.default}",
    "--ledge-edge": "transparent",
  },
  _touch: { width: "24px", height: "24px" },
  _reducedMotion: { "&[data-dragging]": { scale: "1" } },
});

const valueStyles = css({
  fontFamily: "body",
  fontSize: "sm",
  fontWeight: "semibold",
  fontVariantNumeric: "tabular-nums",
  color: "fg.muted",
  whiteSpace: "nowrap",
});

const marksStyles = css({
  position: "relative",
  height: "18px",
  marginInline: "9px",
  fontSize: "xs",
  color: "fg.muted",
  "& > span": {
    position: "absolute",
    top: 0,
    translate: "-50% 0",
    whiteSpace: "nowrap",
  },
  "& > span[data-edge=start]": { translate: "0 0" },
  "& > span[data-edge=end]": { translate: "-100% 0" },
});

/**
 * A value chosen by dragging along a track, for settings with a range:
 * a clock's size, a volume, a dice roll's delay. For a stat or a count,
 * where the exact number matters, use NumberField.
 *
 * ```tsx
 * <Slider label="Volume" showValue format={{ style: "percent" }}
 *   min={0} max={1} step={0.05} value={volume} onValueChange={setVolume} />
 * ```
 */
export function Slider<V extends SliderValue = number>(props: SliderProps<V>) {
  const {
    value,
    defaultValue,
    onValueChange,
    onValueCommitted,
    min = 0,
    max = 100,
    step,
    largeStep,
    format,
    showValue,
    getAriaValueText,
    getThumbLabel,
    marks,
    name,
    "aria-label": ariaLabel,
    id,
    className,
    ref,
    label,
    hideLabel,
    description,
    error,
    invalid,
    required,
    disabled,
    requiredIndicator,
  } = withLayoutProps(props);

  const thumbCount = Array.isArray(value ?? defaultValue)
    ? ((value ?? defaultValue) as readonly number[]).length
    : 1;

  const valueNode = showValue ? (
    <BaseSlider.Value className={valueStyles}>
      {(formatted) => formatted.join(" to ")}
    </BaseSlider.Value>
  ) : undefined;

  return (
    <FieldShell
      label={label}
      hideLabel={hideLabel}
      description={description}
      error={error}
      invalid={invalid}
      required={required}
      disabled={disabled}
      requiredIndicator={requiredIndicator}
      name={name}
      className={className}
      labelPart={BaseSlider.Label}
      labelAccessory={
        label !== undefined && label !== null ? valueNode : undefined
      }
      wrap={(content) => (
        <BaseSlider.Root<V>
          ref={ref}
          id={id}
          className={fieldRootStyles}
          value={value}
          defaultValue={defaultValue}
          onValueChange={(next) => onValueChange?.(next as V)}
          onValueCommitted={(next) => onValueCommitted?.(next as V)}
          min={min}
          max={max}
          step={step}
          largeStep={largeStep}
          format={format}
          disabled={disabled}
          name={name}
          aria-label={ariaLabel}
          thumbAlignment="edge"
        >
          {content}
        </BaseSlider.Root>
      )}
    >
      <BaseSlider.Control className={controlStyles}>
        <BaseSlider.Track className={trackStyles}>
          <BaseSlider.Indicator className={indicatorStyles} />
          {Array.from({ length: thumbCount }, (_, index) => (
            <BaseSlider.Thumb
              key={index}
              index={index}
              className={thumbStyles}
              getAriaLabel={
                getThumbLabel ??
                (ariaLabel && thumbCount === 1 ? () => ariaLabel : undefined)
              }
              getAriaValueText={getAriaValueText}
            />
          ))}
        </BaseSlider.Track>
      </BaseSlider.Control>
      {marks && marks.length > 0 && (
        <div className={marksStyles} aria-hidden>
          {marks.map((mark) => (
            <span
              key={mark.value}
              data-edge={
                mark.value <= min
                  ? "start"
                  : mark.value >= max
                    ? "end"
                    : undefined
              }
              style={{
                insetInlineStart: `${((mark.value - min) / (max - min)) * 100}%`,
              }}
            >
              {mark.label}
            </span>
          ))}
        </div>
      )}
      {showValue && (label === undefined || label === null) && valueNode}
    </FieldShell>
  );
}
