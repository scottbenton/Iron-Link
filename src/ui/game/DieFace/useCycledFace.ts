import { useEffect, useRef, useState } from "react";

import { DieFaceValue, nextDieFace } from "./dieFaceValue";

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
export function useCycledFace(
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
