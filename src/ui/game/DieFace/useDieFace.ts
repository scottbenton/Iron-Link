import { useCallback, useRef, useState } from "react";

import {
  DieFaceValue,
  DieRollResult,
  DieState,
  nextDieFace,
  toDieFace,
} from "./DieFace";

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
