import { useEffect, useRef, useState } from "react";

import { DieFaceValue, nextDieFace } from "./dieFaceValue";

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
export function useCycledFace(
  face: DieFaceValue,
  active: boolean,
): DieFaceValue {
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
