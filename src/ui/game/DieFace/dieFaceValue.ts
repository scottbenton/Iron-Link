export type DieFaceValue = 1 | 2 | 3 | 4 | 5 | 6;

/** A face other than `current`, so every roll visibly changes the die. */
export function nextDieFace(current: DieFaceValue): DieFaceValue {
  return (((current + Math.floor(Math.random() * 5)) % 6) + 1) as DieFaceValue;
}
