import {
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  useId,
  useState,
} from "react";

import { css, cx } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import {
  barCell,
  gappedWedgePath,
  pipCentre,
  pipRadius,
  rimTick,
  ringSegmentPath,
  wedgePath,
} from "./clockGeometry";
import { ClockStrings, defaultClockStrings } from "./clockStrings";

const rootStyles = css({
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1.5",
  maxWidth: "100%",
});

const dialStyles = css({
  "--clock-on": "token(colors.accent.solid)",
  "--clock-off":
    "color-mix(in oklab, token(colors.accent.solid) 18%, transparent)",
  "--clock-preview":
    "color-mix(in oklab, token(colors.accent.solid) 55%, transparent)",
  "--clock-pip-off":
    "color-mix(in oklab, token(colors.accent.solid) 45%, transparent)",
  _dark: {
    "--clock-off":
      "color-mix(in oklab, token(colors.accent.solid) 26%, transparent)",
  },
  display: "block",
  flex: "none",
  borderRadius: "full",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "3px",
  },
  "&[data-interactive]": { cursor: "pointer", touchAction: "manipulation" },
  "&[aria-disabled=true]": { cursor: "not-allowed", opacity: 0.6 },
  width: "80px",
  height: "80px",
  "&[data-size=sm]": { width: "60px", height: "60px" },
  "&[data-size=lg]": { width: "120px", height: "120px" },
  "&[data-variant=bar]": {
    borderRadius: "sm",
    width: "112px",
    height: "16px",
    "&[data-size=sm]": { width: "80px", height: "12px" },
    "&[data-size=lg]": { width: "160px", height: "22px" },
  },
  "& svg": { display: "block", width: "100%", height: "100%" },

  // Each segment paints with --seg, which its state sets.
  "& [data-seg]": {
    "--seg": "var(--clock-off)",
    fill: "var(--seg)",
    stroke: "none",
    transitionProperty: "fill, stroke, opacity",
    transitionDuration: "fast",
    transitionTimingFunction: "out",
  },
  "& [data-seg][data-filled]": { "--seg": "var(--clock-on)" },
  "& [data-seg][data-preview=fill]": { "--seg": "var(--clock-preview)" },
  "& [data-seg][data-preview=clear]": { opacity: 0.45 },
  "& [data-hit]": { fill: "transparent", stroke: "none" },

  // Wedges and ring: a stroke in the segment's own colour rounds corners.
  "&[data-variant=wedges] [data-seg], &[data-variant=ring] [data-seg]": {
    stroke: "var(--seg)",
    strokeWidth: 1.5,
    strokeLinejoin: "round",
  },
  // Sweep: a hairline in the same colour hides the seams between wedges.
  "&[data-variant=sweep] [data-seg]": {
    stroke: "var(--seg)",
    strokeWidth: 0.75,
    strokeLinejoin: "round",
  },
  "& [data-tick]": {
    stroke: "token(colors.border.control)",
    strokeWidth: 3,
    strokeLinecap: "round",
    transitionProperty: "stroke",
    transitionDuration: "fast",
  },
  "& [data-tick][data-filled]": { stroke: "var(--clock-on)" },
  // Pips: empty ones are rings, filled ones solid.
  "&[data-variant=pips] [data-seg]": {
    fill: "transparent",
    stroke: "var(--clock-pip-off)",
    strokeWidth: 2.5,
  },
  "&[data-variant=pips] [data-seg][data-filled]": {
    fill: "var(--clock-on)",
    stroke: "var(--clock-on)",
  },
  "&[data-variant=pips] [data-seg][data-preview=fill]": {
    fill: "var(--clock-preview)",
    stroke: "var(--clock-preview)",
  },
  "& [data-track]": {
    fill: "none",
    stroke: "var(--clock-off)",
    strokeWidth: 1.5,
  },
  // Classic: the old pie, with lighter lines that soften over the fill.
  "&[data-variant=classic] [data-seg]": {
    fill: "token(colors.bg.surface)",
    stroke: "token(colors.border.control)",
    strokeWidth: 2,
    strokeLinejoin: "round",
  },
  "&[data-variant=classic] [data-seg][data-filled]": {
    fill: "var(--clock-on)",
    stroke:
      "color-mix(in oklab, token(colors.accent.solid) 55%, token(colors.bg.surface))",
  },
  "&[data-variant=classic] [data-seg][data-preview=fill]": {
    fill: "var(--clock-preview)",
  },
  "& [data-count]": {
    fill: "token(colors.fg.default)",
    fontFamily: "heading",
    fontWeight: "semibold",
    fontVariantNumeric: "tabular-nums",
  },
  "& [data-count-total]": { fill: "token(colors.fg.muted)" },
  "&[data-complete] [data-count]": { fill: "token(colors.accent.fg)" },
});

const labelStyles = css({
  maxWidth: "100%",
  fontFamily: "heading",
  fontWeight: "semibold",
  fontSize: "sm",
  lineHeight: "snug",
  textAlign: "center",
  textWrap: "balance",
  overflowWrap: "anywhere",
});

const valueStyles = css({
  fontSize: "xs",
  color: "fg.muted",
  fontVariantNumeric: "tabular-nums",
});

export type ClockVariant =
  | "wedges"
  | "ring"
  | "pips"
  | "sweep"
  | "bar"
  | "classic";

/** Variants that draw the count inside the dial. */
const countInside: Record<ClockVariant, boolean> = {
  wedges: false,
  ring: true,
  pips: true,
  sweep: false,
  bar: false,
  classic: false,
};

export interface ClockProps {
  /** The clock's name, such as "The Iron Siege falls". */
  label: string;
  /** 4, 6, 8 or 10 for a campaign or tension clock. */
  segments: number;
  /** Filled segments. */
  value: number;
  /**
   * Sets the filled segments. Makes the clock a slider: click a segment to
   * fill up to it (click the last filled one to clear it), arrow keys step,
   * Home and End empty or fill it, Enter fills the next and clears a full
   * clock.
   */
  onChange?: (value: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  /**
   * How the dial is drawn, always in the accent colour:
   * - `wedges` (default): a pie of wedges parted by a thin gap, no lines.
   * - `ring`: a segmented donut with the count in the middle.
   * - `pips`: a dot per segment around the count.
   * - `sweep`: a solid pie fill with segment ticks around the rim.
   * - `bar`: a notched horizontal bar, for tight rows and lists.
   * - `classic`: the outlined pie, with lighter lines.
   */
  variant?: ClockVariant;
  /** Hides the visible name and count; the clock is still named. */
  hideLabel?: boolean;
  strings?: Partial<ClockStrings>;
  className?: string;
}

/**
 * A segmented clock (campaign, tension, an asset's clock), drawn in the
 * accent colour. Interactive with `onChange` (a slider), else an image.
 */
export function Clock(props: ClockProps) {
  const {
    label,
    segments,
    value: rawValue,
    onChange,
    disabled,
    size = "md",
    variant = "wedges",
    hideLabel,
    strings: stringsProp,
    className,
  } = props;
  const strings = { ...defaultClockStrings, ...stringsProp };

  const labelId = useId();
  const announce = useAnnounce();
  const [hovered, setHovered] = useState<number | null>(null);

  const value = Math.min(Math.max(Math.round(rawValue), 0), segments);
  const valueText = strings.valueText(value, segments);
  const interactive = !!onChange && !disabled;
  const complete = value >= segments;

  const set = (next: number, announceChange: boolean) => {
    if (!onChange || disabled) return;
    const clamped = Math.min(Math.max(next, 0), segments);
    if (clamped === value) return;
    onChange(clamped);
    if (announceChange) {
      announce(strings.changed(label, strings.valueText(clamped, segments)));
    }
  };

  const fillNext = (announceChange: boolean) =>
    set(complete ? 0 : value + 1, announceChange);

  const handleKeyDown = (event: KeyboardEvent) => {
    // A focused slider reads its new value itself, so keys don't announce.
    const keys: Record<string, () => void> = {
      ArrowRight: () => set(value + 1, false),
      ArrowUp: () => set(value + 1, false),
      ArrowLeft: () => set(value - 1, false),
      ArrowDown: () => set(value - 1, false),
      Home: () => set(0, false),
      End: () => set(segments, false),
      Enter: () => fillNext(false),
      " ": () => fillNext(false),
    };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  const handleSegmentClick = (event: MouseEvent, index: number) => {
    event.stopPropagation();
    set(value === index + 1 ? index : index + 1, true);
  };

  const handlePointerEnter = (event: PointerEvent, index: number) => {
    if (interactive && event.pointerType === "mouse") setHovered(index);
  };

  const preview = (index: number) => {
    if (hovered === null) return undefined;
    const target = value === hovered + 1 ? hovered : hovered + 1;
    if (index < target && index >= value) return "fill";
    if (index >= target && index < value) return "clear";
    return undefined;
  };

  const segmentProps = (index: number) => ({
    "data-seg": "",
    "data-filled": index < value || undefined,
    "data-preview": preview(index),
  });

  const hitProps = (index: number) => ({
    "data-hit": "",
    onClick: interactive
      ? (e: MouseEvent) => handleSegmentClick(e, index)
      : undefined,
    onPointerEnter: (e: PointerEvent) => handlePointerEnter(e, index),
  });

  const indexes = Array.from({ length: segments }, (_, index) => index);

  const count = (
    <text
      data-count=""
      x="50"
      y="50"
      textAnchor="middle"
      dominantBaseline="central"
    >
      <tspan fontSize="28">{value}</tspan>
      <tspan data-count-total="" fontSize="15">
        /{segments}
      </tspan>
    </text>
  );

  const svg =
    variant === "bar" ? (
      <svg
        viewBox="0 0 100 14"
        preserveAspectRatio="none"
        aria-hidden
        focusable="false"
      >
        {indexes.map((index) => {
          const cell = barCell(index, segments, segments > 8 ? 2 : 3);
          return (
            <rect
              key={index}
              {...segmentProps(index)}
              x={cell.x}
              y={0}
              width={cell.width}
              height={14}
              rx={2}
            />
          );
        })}
        {indexes.map((index) => {
          const cell = barCell(index, segments, 0);
          return (
            <rect
              key={index}
              {...hitProps(index)}
              x={cell.x}
              y={0}
              width={cell.width}
              height={14}
            />
          );
        })}
      </svg>
    ) : (
      <svg viewBox="-2 -2 104 104" aria-hidden focusable="false">
        {variant === "wedges" &&
          indexes.map((index) => (
            <path
              key={index}
              {...segmentProps(index)}
              d={gappedWedgePath(index, segments, 6)}
            />
          ))}
        {variant === "ring" &&
          indexes.map((index) => (
            <path
              key={index}
              {...segmentProps(index)}
              d={ringSegmentPath(index, segments, 49, 34, 5)}
            />
          ))}
        {variant === "pips" && (
          <>
            <circle data-track="" cx="50" cy="50" r="41" />
            {indexes.map((index) => {
              const centre = pipCentre(index, segments, 41);
              return (
                <circle
                  key={index}
                  {...segmentProps(index)}
                  cx={centre.x}
                  cy={centre.y}
                  r={pipRadius(segments, 41, 8)}
                />
              );
            })}
          </>
        )}
        {variant === "sweep" && (
          <>
            {indexes.map((index) => (
              <path
                key={index}
                {...segmentProps(index)}
                d={wedgePath(index, segments, 41)}
              />
            ))}
            {indexes.map((boundary) => (
              <line
                key={boundary}
                data-tick=""
                data-filled={(value > 0 && boundary <= value) || undefined}
                {...rimTick(boundary, segments, 45.5, 50.5)}
              />
            ))}
          </>
        )}
        {variant === "classic" &&
          indexes.map((index) => (
            <path
              key={index}
              {...segmentProps(index)}
              d={wedgePath(index, segments, 49)}
            />
          ))}
        {countInside[variant] && count}
        {indexes.map((index) => (
          <path
            key={index}
            {...hitProps(index)}
            d={wedgePath(index, segments)}
          />
        ))}
      </svg>
    );

  const dialProps = {
    className: dialStyles,
    "data-size": size,
    "data-variant": variant,
    "data-complete": complete || undefined,
  };

  return (
    <div className={cx(rootStyles, className)}>
      {onChange ? (
        <div
          {...dialProps}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-labelledby={hideLabel ? undefined : labelId}
          aria-label={hideLabel ? label : undefined}
          aria-valuemin={0}
          aria-valuemax={segments}
          aria-valuenow={value}
          aria-valuetext={valueText}
          aria-disabled={disabled || undefined}
          data-interactive={interactive || undefined}
          onKeyDown={interactive ? handleKeyDown : undefined}
          // A click that lands on the dial, not a segment (a screen
          // reader's activate), fills the next segment.
          onClick={interactive ? () => fillNext(true) : undefined}
          onPointerLeave={() => setHovered(null)}
        >
          {svg}
        </div>
      ) : (
        <div {...dialProps} role="img" aria-label={`${label}, ${valueText}`}>
          {svg}
        </div>
      )}
      {!hideLabel && (
        <span
          className={css({ display: "grid", justifyItems: "center" })}
          aria-hidden={onChange ? undefined : true}
        >
          <span id={labelId} className={labelStyles}>
            {label}
          </span>
          {!countInside[variant] && (
            <span className={valueStyles} aria-hidden>
              {value}/{segments}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
