import {
  DiceFive,
  DiceFour,
  DiceOne,
  DiceSix,
  DiceThree,
  DiceTwo,
} from "@phosphor-icons/react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { cva, cx } from "styled-system/css";

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
 * What a roll handler may hand back to the die: the action die it rolled
 * (1 to 6), so the die lands on it, or anything else (nothing, an oracle's
 * 1 to 100), so it lands on a new face of its own. A promise keeps the die
 * cycling until it settles.
 */
export type DieRollResult = unknown;

/** A die's state, spread onto `DieFace`. */
export interface DieState {
  face: DieFaceValue;
  /** Counts rolls, so a roll that lands on the same face still cycles. */
  rolls: number;
  /** True while a roll's result is still on its way. */
  pending?: boolean;
}

export interface DieFaceProps extends CssProp {
  /** The face the die lands on. */
  face: DieFaceValue;
  /**
   * Counts rolls (from `useDieFace`). A change cycles the die even when it
   * lands on the face it showed. Without it, a change of `face` cycles.
   */
  rolls?: number;
  /** Keeps the die cycling until it turns false, then it lands. */
  pending?: boolean;
  /**
   * The icon size: 14px, 18px (default) or 24px, or `inherit` to leave it to
   * the parent's own icon rule (a Button's `svg`, a row's glyph).
   */
  size?: "sm" | "md" | "lg" | "inherit";
  /** The icon weight: `bold` (default), or `fill` as stat cards draw it. */
  weight?: "bold" | "fill";
  className?: string;
}

/** A fixed size: the face fills the root. */
const fill = { width: "100%", height: "100%" };

const rootStyles = cva({
  base: {
    display: "inline-grid",
    flex: "none",
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

/**
 * A die icon (decorative) showing one face. On each roll it cycles through
 * two quick random faces (50ms each, longer while the result is pending)
 * and lands on `face`; with reduced motion it simply shows the new face.
 * Pair it with `useDieFace` on anything that rolls (OracleTextField's
 * button, roll buttons, stat cards, meters, oracle rows), and hand the roll's
 * result back so an action roll lands on its action die.
 */
export function DieFace(props: DieFaceProps) {
  const {
    face: target,
    rolls,
    pending = false,
    size = "md",
    weight = "bold",
    className,
  } = withCssProp(props);
  const face = useCycledFace(target, rolls ?? target, pending);
  const Face = faceIcons[face];
  return (
    <span className={cx(rootStyles({ size }), className)} aria-hidden>
      <Face weight={weight} />
    </span>
  );
}
