import {
  DiceFive,
  DiceFour,
  DiceOne,
  DiceSix,
  DiceThree,
  DiceTwo,
} from "@phosphor-icons/react";
import { useState } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cva, cx } from "styled-system/css";

import { DieFaceValue } from "./dieFaceValue";
import { useCycledFace } from "./useCycledFace";

const faceIcons = {
  1: DiceOne,
  2: DiceTwo,
  3: DiceThree,
  4: DiceFour,
  5: DiceFive,
  6: DiceSix,
} as const;

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

export interface DieFaceProps extends CssProp {
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
  } = withCssProp(props);
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
