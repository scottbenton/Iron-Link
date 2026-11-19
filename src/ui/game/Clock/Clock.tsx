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

import { focusRing } from "ui/styles/focus";
import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cx } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { IconButton } from "../../components/IconButton";
import { Tooltip } from "../../components/Tooltip";
import { TrackCardHeader } from "../ProgressTrack/TrackCardHeader";
import {
  trackCardActionsStyles,
  trackCardBadgeStyles,
  trackCardStepperStyles,
  trackCardStyles,
  trackCardTitleStyles,
} from "../ProgressTrack/trackCardStyles";
import { ringSegmentPath, wedgePath } from "./clockGeometry";
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
  _dark: {
    "--clock-off":
      "color-mix(in oklab, token(colors.accent.solid) 26%, transparent)",
  },
  display: "block",
  flex: "none",
  borderRadius: "full",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  _focusVisible: focusRing.outset,
  "&[data-interactive]": { cursor: "pointer", touchAction: "manipulation" },
  "&[aria-disabled=true]": { cursor: "not-allowed", opacity: 0.6 },
  width: "80px",
  height: "80px",
  "&[data-size=sm]": { width: "60px", height: "60px" },
  "&[data-size=lg]": { width: "120px", height: "120px" },
  "& svg": { display: "block", width: "100%", height: "100%" },

  // Each segment paints with --seg, which its state sets; a stroke in the
  // same colour rounds its corners.
  "& [data-seg]": {
    "--seg": "var(--clock-off)",
    fill: "var(--seg)",
    stroke: "var(--seg)",
    strokeWidth: 1.5,
    strokeLinejoin: "round",
    transitionProperty: "fill, stroke, opacity",
    transitionDuration: "fast",
    transitionTimingFunction: "out",
  },
  "& [data-seg][data-filled]": { "--seg": "var(--clock-on)" },
  "& [data-seg][data-preview=fill]": { "--seg": "var(--clock-preview)" },
  "& [data-seg][data-preview=clear]": { opacity: 0.45 },
  "& [data-hit]": { fill: "transparent", stroke: "none" },

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
  "--clock-hub": "62%",
});

/**
 * The centre: a round button over the dial's middle that adds a segment.
 * Hover tints it behind the count (and the dial previews the next segment).
 * Full, it rests.
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
  _focusVisible: focusRing.outset,
  "&:not([aria-disabled=true])": {
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
  // Full: no tint, so the middle reads as resting.
  "&[aria-disabled=true]": { cursor: "default" },
});

/**
 * The card's dial, centred with its minus and plus either side, so the
 * buttons sit by what they change.
 */
const cardDialRowStyles = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "3",
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

export interface ClockProps extends LayoutProps {
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
  /**
   * `bare` (default): the dial with its name under it, for asset cards and
   * grids. `card`: a card like ProgressTrack's: the same header (eyebrow and
   * menu, then name and description), with the dial under it between its
   * minus and plus, and any actions in a row below.
   */
  presentation?: "bare" | "card";
  /**
   * Card only: a completed clock. A badge in the eyebrow, no minus or plus,
   * and the dial reads as an image.
   */
  completed?: boolean;
  /** Card only: actions in a row under the dial, such as Roll Progress. */
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
 * A segmented clock (campaign, tension, an asset's clock): a ring of
 * segments in the accent colour with the count in the middle. Interactive
 * with `onChange` (a slider), else an image. When interactive, a click or
 * tap on the dial's middle adds one segment; it rests once the clock is
 * full.
 */
export function Clock(props: ClockProps) {
  const {
    label,
    segments,
    value: rawValue,
    onChange: onChangeProp,
    disabled,
    size = "md",
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
  } = withLayoutProps(props);
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

  const svg = (
    <svg viewBox="-2 -2 104 104" aria-hidden focusable="false">
      {indexes.map((index) => (
        <path
          key={index}
          {...segmentProps(index)}
          d={ringSegmentPath(index, segments, 49, 34, 5)}
        />
      ))}
      {count}
      {indexes.map((index) => (
        <path key={index} {...hitProps(index)} d={wedgePath(index, segments)} />
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
  const hub = interactive && (
    <Tooltip title={complete ? strings.fullHint : strings.advanceLabel(label)}>
      <button
        type="button"
        className={hubStyles}
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
      />
    </Tooltip>
  );

  const dialWithHub = (
    <div className={dialWrapStyles}>
      {dial}
      {hub}
    </div>
  );

  if (card) {
    return (
      <div
        className={cx(trackCardStyles, className)}
        data-complete={completed || undefined}
      >
        <TrackCardHeader
          eyebrow={
            (typeLabel || completed) && (
              <>
                {typeLabel && <span>{typeLabel}</span>}
                {completed && (
                  <span className={trackCardBadgeStyles}>
                    <CheckCircle weight="fill" aria-hidden />
                    {strings.completedLabel}
                  </span>
                )}
              </>
            )
          }
          title={
            <Title
              id={labelId}
              className={trackCardTitleStyles}
              aria-hidden={onChange ? undefined : true}
            >
              {label}
            </Title>
          }
          description={description}
          action={headerAction}
        />
        <div className={cardDialRowStyles}>
          {stepButtons && (
            <span className={trackCardStepperStyles}>
              <IconButton
                label={strings.removeLabel(label)}
                size="sm"
                focusableWhenDisabled
                disabled={value === 0}
                onClick={() => set(value - 1, true)}
              >
                <Minus weight="bold" />
              </IconButton>
            </span>
          )}
          {dialWithHub}
          {stepButtons && (
            <span className={trackCardStepperStyles}>
              <IconButton
                label={strings.advanceLabel(label)}
                size="sm"
                focusableWhenDisabled
                disabled={complete}
                onClick={() => set(value + 1, true)}
              >
                <Plus weight="bold" />
              </IconButton>
            </span>
          )}
        </div>
        {actions && (
          <div className={trackCardActionsStyles}>
            <div data-actions="">{actions}</div>
          </div>
        )}
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
        </span>
      )}
    </div>
  );
}
