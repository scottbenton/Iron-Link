import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import {
  CSSProperties,
  ReactNode,
  Ref,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";
import { focusRing } from "ui/styles/focus";
import { ledgeLayers } from "ui/styles/ledge";

import { css, cva, cx } from "styled-system/css";

import { mergeRefs, useControllableState } from "../Field";

export interface SegmentedControlOption<V extends string = string> {
  value: V;
  /** The segment's text. */
  label: ReactNode;
  /** An icon before the label. */
  icon?: ReactNode;
  /** Names an icon-only segment; needed when `label` is not text. */
  "aria-label"?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<V extends string = string>
  extends CssProp {
  options: SegmentedControlOption<V>[];
  /** The chosen segment, when controlled. One is always chosen. */
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  /** Names the control for screen readers. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  size?: "sm" | "md";
  /** Stretch to the container, with equal segments. */
  fullWidth?: boolean;
  disabled?: boolean;
  /** Submitted with a form. */
  name?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

const trackStyles = cva({
  base: {
    boxSizing: "border-box",
    position: "relative",
    display: "inline-grid",
    gridAutoFlow: "column",
    gridAutoColumns: "auto",
    gap: "0.5",
    maxWidth: "100%",
    padding: "1",
    borderRadius: "md",
    background: "bg.emphasized",
    boxShadow: "field",
    isolation: "isolate",
    "&[data-full-width]": {
      display: "grid",
      width: "100%",
      gridAutoColumns: "minmax(0, 1fr)",
    },
    "&[data-disabled]": { opacity: 0.6 },
  },
  variants: {
    size: {
      sm: { "--segment-height": "26px" },
      md: { "--segment-height": "{sizes.control.sm}" },
    },
  },
});

/**
 * The raised thumb behind the chosen segment. It slides and resizes to the
 * segment it is measured against; it stays hidden until first measured, so
 * it never flies in from the corner.
 */
const thumbStyles = css({
  position: "absolute",
  zIndex: -1,
  top: "1",
  bottom: "1",
  left: 0,
  width: "var(--thumb-width)",
  translate: "var(--thumb-x) 0",
  borderRadius: "sm",
  // The face's 1px border sits just outside the thumb's box, where the ring
  // used to be.
  ...ledgeLayers("token(radii.sm)"),
  "--ledge-face": "{colors.bg.surface}",
  "--ledge-border": "{colors.border.default}",
  "--ledge-edge": "{colors.border.edge}",
  transitionProperty: "translate, width",
  transitionDuration: "normal",
  transitionTimingFunction: "out",
  "&:not([data-measured])": { visibility: "hidden" },
  "&[data-instant]": { transitionDuration: "0s" },
  _reducedMotion: { transitionDuration: "0s" },
});

const segmentStyles = css({
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1.5",
  minWidth: 0,
  minHeight: "var(--segment-height)",
  paddingInline: "3",
  borderRadius: "sm",
  color: "fg.muted",
  fontFamily: "body",
  fontSize: "sm",
  fontWeight: "semibold",
  lineHeight: "none",
  whiteSpace: "nowrap",
  cursor: "pointer",
  outline: "none",
  userSelect: "none",
  WebkitTapHighlightColor: "transparent",
  transitionProperty: "color",
  transitionDuration: "fast",
  "& > svg": { flex: "none", width: "icon.md", height: "icon.md" },
  // The label clips sideways to end in an ellipsis, and a clip is
  // two-way: at the segment's `lineHeight: none` its box is 1em tall, so
  // descenders (the g in Starforged) were cut off. Block padding grows the
  // clip box past the glyphs at any font size, and the matching negative
  // margin keeps the label's laid-out height, so nothing moves.
  "& > span": {
    overflow: "hidden",
    textOverflow: "ellipsis",
    paddingBlock: "0.25em",
    marginBlock: "-0.25em",
  },
  "&:hover:not([data-checked], [data-disabled])": { color: "fg.default" },
  "&[data-checked]": { color: "fg.default" },
  _focusVisible: focusRing.outset,
  "&[data-disabled]": { cursor: "not-allowed", color: "fg.disabled" },
  _touch: { minHeight: "control.md" },
});

/**
 * One choice from two to five short options, shown as a sunken track with a
 * raised thumb that slides to the choice: Moves or Oracles, Edit or Preview,
 * a list or grid view. One option is always chosen. Arrow keys move the
 * choice; it is a radio group to assistive technology.
 *
 * ```tsx
 * <SegmentedControl aria-label="Reference" value={tab} onValueChange={setTab}
 *   options={[{ value: "moves", label: "Moves" }, { value: "oracles", label: "Oracles" }]} />
 * ```
 */
export function SegmentedControl<V extends string = string>(
  props: SegmentedControlProps<V>,
) {
  const {
    options,
    value,
    defaultValue,
    onValueChange,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    size = "md",
    fullWidth,
    disabled,
    name,
    className,
    ref,
  } = withCssProp(props);
  const [current, setCurrent] = useControllableState<V | undefined>(
    value,
    defaultValue ?? options[0]?.value,
    (next) => {
      if (next !== undefined) onValueChange?.(next);
    },
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; width: number } | null>(null);
  const measuredOnce = useRef(false);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const chosen = track.querySelector<HTMLElement>(
        "[role=radio][data-checked]",
      );
      if (!chosen) {
        setThumb(null);
        return;
      }
      setThumb((previous) => {
        const next = { x: chosen.offsetLeft, width: chosen.offsetWidth };
        return previous &&
          previous.x === next.x &&
          previous.width === next.width
          ? previous
          : next;
      });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    track
      .querySelectorAll<HTMLElement>("[role=radio]")
      .forEach((segment) => observer.observe(segment));
    return () => observer.disconnect();
  }, [current, options]);

  // The first measurement places the thumb without sliding it in.
  const instant = !measuredOnce.current;
  useLayoutEffect(() => {
    if (thumb) measuredOnce.current = true;
  }, [thumb]);

  return (
    <BaseRadioGroup<V>
      ref={mergeRefs(ref, trackRef)}
      className={cx(trackStyles({ size }), className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-full-width={fullWidth ? "" : undefined}
      value={current}
      onValueChange={(next) => setCurrent(next)}
      disabled={disabled}
      name={name}
    >
      <span
        className={thumbStyles}
        aria-hidden
        data-measured={thumb ? "" : undefined}
        data-instant={instant ? "" : undefined}
        style={
          {
            "--thumb-x": `${thumb?.x ?? 0}px`,
            "--thumb-width": `${thumb?.width ?? 0}px`,
          } as CSSProperties
        }
      />
      {options.map((option) => (
        <BaseRadio.Root
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          aria-label={option["aria-label"]}
          className={segmentStyles}
        >
          {option.icon}
          {option.label !== undefined && option.label !== null && (
            <span>{option.label}</span>
          )}
        </BaseRadio.Root>
      ))}
    </BaseRadioGroup>
  );
}
