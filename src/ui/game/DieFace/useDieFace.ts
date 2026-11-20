import { useCallback, useState } from "react";

import { DieFaceValue, nextDieFace } from "./dieFaceValue";

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
