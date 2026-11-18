import { CheckCircle, Minus, Plus } from "@phosphor-icons/react";
import {
  ElementType,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
  useId,
  useState,
} from "react";

import { css, cx } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { IconButton } from "../../components/IconButton";
import { Tooltip } from "../../components/Tooltip";
import {
  trackCardBadgeStyles,
  trackCardControlsStyles,
  trackCardDescriptionStyles,
  trackCardEyebrowStyles,
  trackCardHeadStyles,
  trackCardStyles,
  trackCardTitleStyles,
} from "../ProgressTrack/trackCardStyles";
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
import { advanceClock, clampClockValue } from "./clockValue";

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
    fontWeight: "bold",
    fontVariantNumeric: "tabular-nums",
  },
  "& [data-count-total]": { fill: "token(colors.fg.muted)" },
  "&[data-complete] [data-count]": { fill: "token(colors.accent.fg)" },
});

/** Holds the dial and, over its middle, the centre button. */
const dialWrapStyles = css({
  position: "relative",
  display: "grid",
  flex: "none",
  "--clock-hub": "32%",
  "&[data-variant=ring]": { "--clock-hub": "62%" },
  "&[data-variant=pips]": { "--clock-hub": "58%" },
});

/**
 * The centre: a round button over the dial's middle that adds a segment.
 * Hover tints it (and the dial previews the next segment); a pie, with no
 * count in its middle, also shows a plus. Full, it rests.
 */
const hubStyles = css({
  position: "absolute",
  top: "50%",
  left: "50%",
  width: "var(--clock-hub)",
  aspectRatio: "1",
  translate: "-50% -50%",
  display: "grid",
  placeItems: "center",
  padding: 0,
  margin: 0,
  borderWidth: 0,
  borderRadius: "full",
  background: "transparent",
  color: "accent.fg",
  cursor: "pointer",
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
  outline: "none",
  transitionProperty: "background-color, opacity",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "1px",
  },
  "& svg": { width: "55%", height: "55%", opacity: 0 },
  // Ring and pips: a light tint behind the count.
  "&:not([aria-disabled=true]):is([data-variant=ring], [data-variant=pips])": {
    _hoverable: {
      _hover: {
        background:
          "color-mix(in oklab, token(colors.accent.solid) 12%, transparent)",
      },
    },
    _active: {
      background:
        "color-mix(in oklab, token(colors.accent.solid) 22%, transparent)",
    },
  },
  // Pies: a surface disc with a plus, so it reads over a filled wedge.
  "&:not([aria-disabled=true]):is([data-variant=wedges], [data-variant=sweep], [data-variant=classic])":
    {
      _hoverable: {
        _hover: {
          background: "bg.surface",
          boxShadow: "0 0 0 1px token(colors.border.control)",
          "& svg": { opacity: 1 },
        },
      },
      _active: {
        background:
          "color-mix(in oklab, token(colors.accent.solid) 16%, token(colors.bg.surface))",
        boxShadow: "0 0 0 1px token(colors.border.control)",
        "& svg": { opacity: 1 },
      },
    },
  // Full: no tint and no plus, so the middle reads as resting.
  "&[aria-disabled=true]": { cursor: "default" },
});

/**
 * The card's body: the dial, then any actions beside it. On a narrow card
 * the actions wrap under the dial rather than squeeze it.
 */
const cardBodyStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  columnGap: "4",
  rowGap: "3",
});

const cardActionsStyles = css({
  flex: "1 1 9rem",
  minWidth: 0,
});

const cardDialStyles = css({
  display: "grid",
  justifyItems: "center",
  gap: "0.5",
});

const labelStyles = css({
  maxWidth: "100%",
  fontFamily: "heading",
  fontWeight: "bold",
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
   * - `ring` (default): a segmented donut with the count in the middle.
   * - `wedges`: a pie of wedges parted by a thin gap, no lines.
   * - `pips`: a dot per segment around the count.
   * - `sweep`: a solid pie fill with segment ticks around the rim.
   * - `bar`: a notched horizontal bar, for tight rows and lists.
   * - `classic`: the outlined pie, with lighter lines.
   */
  variant?: ClockVariant;
  /** Hides the visible name and count; the clock is still named. */
  hideLabel?: boolean;
  /**
   * `bare` (default): the dial with its name under it, for asset cards and
   * grids. `card`: a card like ProgressTrack's: the same header (eyebrow,
   * name, description, then minus, plus and the menu at the top right),
   * with the dial under it where the track has its boxes.
   */
  presentation?: "bare" | "card";
  /**
   * Card only: a completed clock. A badge in the eyebrow, no minus or plus,
   * and the dial reads as an image.
   */
  completed?: boolean;
  /** Card only: actions beside the dial, such as a Roll Progress button. */
  actions?: ReactNode;
  /** Card only: the clock's kind, shown above the name ("Tension Clock"). */
  typeLabel?: string;
  /** Card only: a line under the name. */
  description?: string;
  /** Card only: a control at the top right, such as the clock's menu. */
  headerAction?: ReactNode;
  /**
   * Card only: the name's element. A span by default: a clock's name only
   * looks like a heading (CLAUDE.md).
   */
  titleAs?: ElementType;
  strings?: Partial<ClockStrings>;
  className?: string;
}

/**
 * A segmented clock (campaign, tension, an asset's clock), drawn in the
 * accent colour. Interactive with `onChange` (a slider), else an image.
 * When interactive, a click or tap on the dial's middle adds one segment
 * (except on the bar, which has no middle); it rests once the clock is full.
 */
export function Clock(props: ClockProps) {
  const {
    label,
    segments,
    value: rawValue,
    onChange: onChangeProp,
    disabled,
    size = "md",
    variant = "ring",
    hideLabel,
    presentation = "bare",
    completed,
    actions,
    typeLabel,
    description,
    headerAction,
    titleAs: Title = "span",
    strings: stringsProp,
    className,
  } = props;
  const strings = { ...defaultClockStrings, ...stringsProp };

  const labelId = useId();
  const announce = useAnnounce();
  const [hovered, setHovered] = useState<number | null>(null);

  const card = presentation === "card";
  // A completed card clock is a record, not a control.
  const onChange = card && completed ? undefined : onChangeProp;
  const value = clampClockValue(rawValue, segments);
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

  const handleAdvance = () => {
    const next = advanceClock(value, segments);
    if (next === null) return;
    set(next, true);
    // Keep previewing the segment after the new one while the pointer stays.
    setHovered(next < segments ? next : null);
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

  const named = card || !hideLabel;
  // The card's minus and plus, like the track's, so the hub is only a
  // shortcut for the pointer there.
  const stepButtons = card && interactive;

  const dialProps = {
    className: dialStyles,
    "data-size": size,
    "data-variant": variant,
    "data-complete": complete || undefined,
  };

  const dial = onChange ? (
    <div
      {...dialProps}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-labelledby={named ? labelId : undefined}
      aria-label={named ? undefined : label}
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
  );

  // The centre sits beside the slider, not inside it (a slider's content
  // is presentational). It is out of the tab order: on the keyboard, Enter
  // on the slider does the same.
  const hub = interactive && variant !== "bar" && (
    <Tooltip title={complete ? strings.fullHint : strings.advanceLabel(label)}>
      <button
        type="button"
        className={hubStyles}
        data-variant={variant}
        tabIndex={-1}
        aria-label={strings.advanceLabel(label)}
        aria-disabled={complete || undefined}
        // The card's plus has the same name and is in the tab order.
        aria-hidden={stepButtons || undefined}
        onClick={handleAdvance}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse" && !complete) setHovered(value);
        }}
        onPointerLeave={() => setHovered(null)}
      >
        <Plus weight="bold" aria-hidden />
      </button>
    </Tooltip>
  );

  const dialWithHub = (
    <div className={dialWrapStyles} data-variant={variant}>
      {dial}
      {hub}
    </div>
  );

  const countText = !countInside[variant] && (
    <span className={valueStyles} aria-hidden>
      {value}/{segments}
    </span>
  );

  if (card) {
    return (
      <div
        className={cx(trackCardStyles, className)}
        data-complete={completed || undefined}
      >
        <div className={trackCardHeadStyles}>
          <div className={css({ minWidth: 0 })}>
            {(typeLabel || completed) && (
              <p className={trackCardEyebrowStyles}>
                {typeLabel && <span>{typeLabel}</span>}
                {completed && (
                  <span className={trackCardBadgeStyles}>
                    <CheckCircle weight="fill" aria-hidden />
                    {strings.completedLabel}
                  </span>
                )}
              </p>
            )}
            <Title
              id={labelId}
              className={trackCardTitleStyles}
              aria-hidden={onChange ? undefined : true}
            >
              {label}
            </Title>
            {description && (
              <p className={trackCardDescriptionStyles}>{description}</p>
            )}
          </div>
          {(stepButtons || headerAction) && (
            <div className={trackCardControlsStyles}>
              {stepButtons && (
                <>
                  <IconButton
                    label={strings.removeLabel(label)}
                    size="sm"
                    focusableWhenDisabled
                    disabled={value === 0}
                    onClick={() => set(value - 1, true)}
                  >
                    <Minus weight="bold" />
                  </IconButton>
                  <IconButton
                    label={strings.advanceLabel(label)}
                    size="sm"
                    focusableWhenDisabled
                    disabled={complete}
                    onClick={() => set(value + 1, true)}
                  >
                    <Plus weight="bold" />
                  </IconButton>
                </>
              )}
              {headerAction}
            </div>
          )}
        </div>
        <div className={cardBodyStyles}>
          <div className={cardDialStyles}>
            {dialWithHub}
            {countText}
          </div>
          {actions && <div className={cardActionsStyles}>{actions}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={cx(rootStyles, className)}>
      {dialWithHub}
      {!hideLabel && (
        <span
          className={css({ display: "grid", justifyItems: "center" })}
          aria-hidden={onChange ? undefined : true}
        >
          <span id={labelId} className={labelStyles}>
            {label}
          </span>
          {countText}
        </span>
      )}
    </div>
  );
}
