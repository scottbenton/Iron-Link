import {
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  useId,
  useState,
} from "react";

import { css, cx } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { ClockStrings, defaultClockStrings } from "./clockStrings";

const rootStyles = css({
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1.5",
  maxWidth: "100%",
});

const dialStyles = css({
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
  "& svg": { display: "block", width: "100%", height: "100%" },
  "& path": {
    stroke: "border.control",
    strokeWidth: 4,
    strokeLinejoin: "round",
    fill: "bg.surface",
    transitionProperty: "fill, opacity",
    transitionDuration: "fast",
    transitionTimingFunction: "out",
  },
  "& path[data-filled]": { fill: "accent.solid" },
  "& path[data-preview=fill]": { fill: "accent.soft" },
  "& path[data-preview=clear]": { opacity: 0.4 },
  "&[data-complete] path[data-filled]": { fill: "danger.solid" },
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

function segmentPath(index: number, segments: number): string {
  const angle = 360 / segments;
  const start = (Math.PI * angle * index) / 180;
  const end = (Math.PI * angle * (index + 1)) / 180;
  const large = angle > 180 ? 1 : 0;
  const sx = 50 + 50 * Math.sin(start);
  const sy = 50 - 50 * Math.cos(start);
  const ex = 50 + 50 * Math.sin(end);
  const ey = 50 - 50 * Math.cos(end);
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return `M 50 50 L ${round(sx)} ${round(sy)} A 50 50 0 ${large} 1 ${round(ex)} ${round(ey)} z`;
}

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
  /** Hides the visible name and count; the clock is still named. */
  hideLabel?: boolean;
  strings?: Partial<ClockStrings>;
  className?: string;
}

/** A segmented clock. Full, it turns the danger colour. */
export function Clock(props: ClockProps) {
  const {
    label,
    segments,
    value: rawValue,
    onChange,
    disabled,
    size = "md",
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

  const svg = (
    <svg viewBox="-2 -2 104 104" aria-hidden focusable="false">
      {Array.from({ length: segments }, (_, index) => (
        <path
          key={index}
          d={segmentPath(index, segments)}
          data-filled={index < value || undefined}
          data-preview={preview(index)}
          onClick={
            interactive ? (e) => handleSegmentClick(e, index) : undefined
          }
          onPointerEnter={(e) => handlePointerEnter(e, index)}
        />
      ))}
    </svg>
  );

  const dialProps = {
    className: dialStyles,
    "data-size": size,
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
          <span className={valueStyles} aria-hidden>
            {value}/{segments}
          </span>
        </span>
      )}
    </div>
  );
}
