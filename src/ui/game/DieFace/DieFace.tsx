import {
  DiceFive,
  DiceFour,
  DiceOne,
  DiceSix,
  DiceThree,
  DiceTwo,
} from "@phosphor-icons/react";
import { useCallback, useState } from "react";

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

export interface DieFaceProps extends LayoutProps {
  /** The face showing. Changing it crossfades from the old face. */
  face: DieFaceValue;
  /** The icon size: 14px, 18px (default) or 24px. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const rootStyles = cva({
  base: {
    display: "inline-grid",
    flex: "none",
    // Both faces share one cell, so the new one fades in over the old. The
    // layers set no display, which the outgoing one turns off.
    "& > *": { gridArea: "1 / 1" },
    "& svg": { display: "block", width: "100%", height: "100%" },
  },
  variants: {
    size: {
      sm: { width: "icon.sm", height: "icon.sm" },
      md: { width: "icon.md", height: "icon.md" },
      lg: { width: "icon.lg", height: "icon.lg" },
    },
  },
  defaultVariants: { size: "md" },
});

// The two faces fade over the same short time, the new one easing out and
// the old easing in, so the die never looks half empty between them.
const enterStyles = css({
  animation: "fadeIn token(durations.fast) token(easings.out)",
  _reducedMotion: { animation: "none" },
});

const exitStyles = css({
  animation: "fadeOut token(durations.fast) token(easings.in) forwards",
  // A straight swap: the old face goes at once.
  _reducedMotion: { display: "none" },
});

/**
 * A die icon (bold, decorative) showing one face. When `face` changes, the
 * new face crossfades in over the old one, quickly; with reduced motion it
 * simply replaces it. Pair it with `useDieFace` on anything that rolls, such
 * as OracleTextField's button, so each roll shows a new face.
 *
 * ```tsx
 * const [face, rollDie] = useDieFace();
 * <button onClick={() => { rollDie(); roll(); }}><DieFace face={face} /></button>
 * ```
 */
export function DieFace(props: DieFaceProps) {
  const { face, size = "md", className } = withLayoutProps(props);
  // The face before the last change, kept while it fades out. Updated
  // during render, so the new face never shows a frame without the fade.
  const [shown, setShown] = useState({
    face,
    previous: null as DieFaceValue | null,
    change: 0,
  });
  if (shown.face !== face) {
    setShown({ face, previous: shown.face, change: shown.change + 1 });
  }
  const Face = faceIcons[shown.face];
  const Previous = shown.previous === null ? null : faceIcons[shown.previous];
  const change = shown.change;

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
          <Previous weight="bold" />
        </span>
      )}
      <span
        key={`in-${change}`}
        className={change > 0 ? enterStyles : undefined}
      >
        <Face weight="bold" />
      </span>
    </span>
  );
}
