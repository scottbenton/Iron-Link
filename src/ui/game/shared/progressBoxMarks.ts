/**
 * The four marks of a progress box in a 20 by 20 box, in the order they are
 * ticked: two diagonals, then a cross. All four make a full box.
 */
export const PROGRESS_BOX_MARKS = [
  [3, 17, 17, 3],
  [3, 3, 17, 17],
  [10, 1.5, 10, 18.5],
  [1.5, 10, 18.5, 10],
] as const;
