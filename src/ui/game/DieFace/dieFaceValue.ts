export type DieFaceValue = 1 | 2 | 3 | 4 | 5 | 6;

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
