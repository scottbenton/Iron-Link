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

import { cva, cx } from "styled-system/css";

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

/** `value` as a die face, or undefined when it is not a whole 1 to 6. */
export function toDieFace(value: unknown): DieFaceValue | undefined {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 6
    ? (value as DieFaceValue)
    : undefined;
}

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

/**
 * A die for a button that rolls something: its state, to spread onto
 * `DieFace`, and a `roll` to call with the roll's result. When the result
 * is the action die (a whole number from 1 to 6) the die lands on it;
 * otherwise it lands on a new face. Starts on five, the die the app shows
 * everywhere else.
 *
 * ```tsx
 * const [die, rollDie] = useDieFace();
 * <button onClick={() => rollDie(onRoll())}><DieFace {...die} /></button>
 * ```
 */
export function useDieFace(
  initial: DieFaceValue = 5,
): [DieState, (result?: DieRollResult) => void] {
  const [die, setDie] = useState<DieState>({ face: initial, rolls: 0 });
  // Only the latest roll may land the die.
  const latest = useRef(0);
  const land = useCallback((token: number, result: unknown) => {
    if (token !== latest.current) return;
    setDie((current) => ({
      face: toDieFace(result) ?? nextDieFace(current.face),
      rolls: current.rolls,
    }));
  }, []);
  const roll = useCallback(
    (result?: DieRollResult) => {
      const token = ++latest.current;
      if (result instanceof Promise) {
        setDie((current) => ({
          ...current,
          rolls: current.rolls + 1,
          pending: true,
        }));
        result.then(
          (value: unknown) => land(token, value),
          () => land(token, undefined),
        );
        return;
      }
      setDie((current) => ({
        face: toDieFace(result) ?? nextDieFace(current.face),
        rolls: current.rolls + 1,
      }));
    },
    [land],
  );
  return [die, roll];
}

export interface DieFaceProps extends LayoutProps {
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

/** How long each in-between face shows, and how many show at least. */
const CYCLE_STEP_MS = 50;
const CYCLE_STEPS = 2;
/** A result that never arrives stops the cycling after this many faces. */
const CYCLE_MAX_STEPS = 100;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/**
 * The face to draw: on each roll a couple of random faces in turn (more
 * while the result is pending), then `face`. With reduced motion the die
 * keeps its face while pending and then simply shows the new one.
 */
function useCycledFace(
  face: DieFaceValue,
  rollKey: number,
  pending: boolean,
): DieFaceValue {
  const [shown, setShown] = useState(face);
  // Read by the running cycle, so a result arriving mid-cycle lands it.
  const target = useRef({ face, pending });
  target.current = { face, pending };
  // The roll the last cycle started for, so mounting (or a rerender of the
  // same roll) shows the face without cycling.
  const started = useRef(rollKey);
  const cycling = useRef(false);

  // A new roll starts a cycle; the face and pending are read live from
  // `target`, so a result arriving mid-cycle lands it.
  useEffect(() => {
    if (rollKey === started.current) return;
    started.current = rollKey;
    if (prefersReducedMotion()) return;
    cycling.current = true;
    let step = 0;
    let current = target.current.face;
    const advance = () => {
      const next = target.current;
      if (step >= CYCLE_MAX_STEPS || (step >= CYCLE_STEPS && !next.pending)) {
        window.clearInterval(timer);
        cycling.current = false;
        setShown(next.face);
        return;
      }
      step += 1;
      let between = nextDieFace(current);
      // The last face before landing is never the one it lands on.
      if (!next.pending && step >= CYCLE_STEPS && between === next.face) {
        between = nextDieFace(between);
      }
      current = between;
      setShown(between);
    };
    const timer = window.setInterval(advance, CYCLE_STEP_MS);
    // The first in-between face shows straight away.
    advance();
    return () => {
      window.clearInterval(timer);
      cycling.current = false;
    };
  }, [rollKey]);

  // Outside a cycle (reduced motion, or a face set without a roll), the
  // die shows its face once nothing is pending.
  useEffect(() => {
    if (!cycling.current && !pending) setShown(face);
  }, [face, pending, rollKey]);

  return shown;
}

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
  } = withLayoutProps(props);
  const face = useCycledFace(target, rolls ?? target, pending);
  const Face = faceIcons[face];
  return (
    <span className={cx(rootStyles({ size }), className)} aria-hidden>
      <Face weight={weight} />
    </span>
  );
}
