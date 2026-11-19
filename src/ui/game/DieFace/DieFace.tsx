import {
  DiceFive,
  DiceFour,
  DiceOne,
  DiceSix,
  DiceThree,
  DiceTwo,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cva, cx } from "styled-system/css";

export type DieFaceValue = 1 | 2 | 3 | 4 | 5 | 6;

const faceIcons = {
  1: DiceOne,
  2: DiceTwo,
  3: DiceThree,
  4: DiceFour,
  5: DiceFive,
  6: DiceSix,
} as const;

/** A face other than `current`, so every roll visibly changes the die. */
export function nextDieFace(current: DieFaceValue): DieFaceValue {
  return (((current + Math.floor(Math.random() * 5)) % 6) + 1) as DieFaceValue;
}

/**
 * A die's face and a `roll` that turns it to a new one, for a button that
 * rolls something. Starts on five, the die the app shows everywhere else.
 */
export function useDieFace(
  initial: DieFaceValue = 5,
): [DieFaceValue, () => void] {
  const [face, setFace] = useState<DieFaceValue>(initial);
  const roll = useCallback(() => setFace(nextDieFace), []);
  return [face, roll];
}

/**
 * How a new face arrives. The options are here to compare (see the
 * DieFace story "Motion options"); once one is chosen the rest go.
 * - `swap`: the new face replaces the old at once.
 * - `tilt`: the new face turns in from a small angle.
 * - `pop`: the new face grows in from a little smaller.
 * - `cycle`: two quick random faces flash before it lands.
 * - `fade`: the new face crossfades over the old.
 */
export type DieFaceMotion = "swap" | "tilt" | "pop" | "cycle" | "fade";

export interface DieFaceProps extends LayoutProps {
  /** The face showing. Changing it shows the new face with `motion`. */
  face: DieFaceValue;
  /**
   * The icon size: 14px, 18px (default) or 24px, or `inherit` to leave it to
   * the parent's own icon rule (a Button's `svg`, a row's glyph).
   */
  size?: "sm" | "md" | "lg" | "inherit";
  /** The icon weight: `bold` (default), or `fill` as stat cards draw it. */
  weight?: "bold" | "fill";
  /** How a new face arrives; `tilt` by default. */
  motion?: DieFaceMotion;
  className?: string;
}

/** A fixed size: the face fills the root. */
const fill = { width: "100%", height: "100%" };

const rootStyles = cva({
  base: {
    display: "inline-grid",
    flex: "none",
    // Both faces share one cell, so a fading face sits over the old one.
    "& > *": { gridArea: "1 / 1", display: "block" },
    "& svg": { display: "block" },
  },
  variants: {
    size: {
      sm: { width: "icon.sm", height: "icon.sm", "& svg": fill },
      md: { width: "icon.md", height: "icon.md", "& svg": fill },
      lg: { width: "icon.lg", height: "icon.lg", "& svg": fill },
      inherit: {},
    },
  },
  defaultVariants: { size: "md" },
});

/** Each motion's entrance; none under reduced motion. */
const enterStyles = {
  tilt: css({
    animation: "dieTilt token(durations.fast) token(easings.out)",
    _reducedMotion: { animation: "none" },
  }),
  pop: css({
    animation: "diePop token(durations.fast) token(easings.out)",
    _reducedMotion: { animation: "none" },
  }),
  fade: css({
    animation: "fadeIn token(durations.fast) token(easings.out)",
    _reducedMotion: { animation: "none" },
  }),
};

const exitStyles = css({
  animation: "fadeOut token(durations.fast) token(easings.in) forwards",
  _reducedMotion: { display: "none" },
});

/** The time each in-between face shows for `cycle`. */
const CYCLE_STEP_MS = 50;
const CYCLE_STEPS = 2;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/**
 * For `cycle`, the face to draw: a couple of random faces in turn, then
 * `face`. Any other motion draws `face` at once.
 */
function useCycledFace(face: DieFaceValue, active: boolean): DieFaceValue {
  const [shown, setShown] = useState(face);
  // The face the last cycle ended on, so mounting (or a rerender with the
  // same face) shows it without cycling.
  const landed = useRef(face);
  useEffect(() => {
    if (face === landed.current) return;
    landed.current = face;
    if (!active || prefersReducedMotion()) {
      setShown(face);
      return;
    }
    let step = 0;
    let current = face;
    const timer = window.setInterval(() => {
      step += 1;
      if (step > CYCLE_STEPS) {
        window.clearInterval(timer);
        setShown(face);
        return;
      }
      current = nextDieFace(current);
      setShown(current === face ? nextDieFace(face) : current);
    }, CYCLE_STEP_MS);
    // The first in-between face shows straight away.
    current = nextDieFace(face);
    setShown(current);
    return () => window.clearInterval(timer);
  }, [face, active]);
  return active ? shown : face;
}

/**
 * A die icon (decorative) showing one face. When `face` changes the new
 * face arrives with `motion`, quickly; with reduced motion it simply
 * replaces the old one. Pair it with `useDieFace` on anything that rolls
 * (OracleTextField's button, roll buttons, stat cards, meters, oracle
 * rows), so each roll shows a new face.
 *
 * ```tsx
 * const [face, rollDie] = useDieFace();
 * <button onClick={() => { rollDie(); roll(); }}><DieFace face={face} /></button>
 * ```
 */
export function DieFace(props: DieFaceProps) {
  const {
    face: target,
    size = "md",
    weight = "bold",
    motion = "tilt",
    className,
  } = withLayoutProps(props);
  const face = useCycledFace(target, motion === "cycle");
  // The face before the last change, and a count that restarts the
  // entrance. Updated during render, so the new face never shows a frame
  // without its motion.
  const [shown, setShown] = useState({
    face,
    previous: null as DieFaceValue | null,
    change: 0,
  });
  if (shown.face !== face) {
    setShown({ face, previous: shown.face, change: shown.change + 1 });
  }
  const Face = faceIcons[shown.face];
  const Previous =
    motion === "fade" && shown.previous !== null
      ? faceIcons[shown.previous]
      : null;
  const change = shown.change;
  const enter =
    change > 0 && (motion === "tilt" || motion === "pop" || motion === "fade")
      ? enterStyles[motion]
      : undefined;

  return (
    <span className={cx(rootStyles({ size }), className)} aria-hidden>
      {Previous && (
        <span
          key={`out-${change}`}
          className={exitStyles}
          onAnimationEnd={() =>
            setShown((current) =>
              current.change === change
                ? { ...current, previous: null }
                : current,
            )
          }
        >
          <Previous weight={weight} />
        </span>
      )}
      <span key={`in-${change}`} className={enter}>
        <Face weight={weight} />
      </span>
    </span>
  );
}
