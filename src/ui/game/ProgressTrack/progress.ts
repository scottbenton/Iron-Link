import type { TFunction } from "i18next";

export const TICKS_PER_BOX = 4;
export const PROGRESS_BOXES = 10;
export const MAX_TICKS = TICKS_PER_BOX * PROGRESS_BOXES;

export type ProgressRank =
  | "troublesome"
  | "dangerous"
  | "formidable"
  | "extreme"
  | "epic";

/** Ticks one Mark Progress adds at each rank. */
export const ticksPerMark: Record<ProgressRank, number> = {
  troublesome: 12,
  dangerous: 8,
  formidable: 4,
  extreme: 2,
  epic: 1,
};

export function getRankLabels(t: TFunction): Record<ProgressRank, string> {
  return {
    troublesome: t("ui.progress.rank-troublesome", "Troublesome"),
    dangerous: t("ui.progress.rank-dangerous", "Dangerous"),
    formidable: t("ui.progress.rank-formidable", "Formidable"),
    extreme: t("ui.progress.rank-extreme", "Extreme"),
    epic: t("ui.progress.rank-epic", "Epic"),
  };
}

/** Clamps a tick count to a track, 0 to 40. */
export function clampTicks(ticks: number): number {
  return Math.min(Math.max(Math.floor(ticks), 0), MAX_TICKS);
}

/** The progress score a progress roll uses: full boxes only, 0 to 10. */
export function getProgressScore(ticks: number): number {
  return Math.floor(clampTicks(ticks) / TICKS_PER_BOX);
}

/** Splits ticks into full boxes and the ticks in the next box. */
export function getProgressBoxes(ticks: number): {
  boxes: number;
  ticks: number;
} {
  const clamped = clampTicks(ticks);
  return {
    boxes: Math.floor(clamped / TICKS_PER_BOX),
    ticks: clamped % TICKS_PER_BOX,
  };
}

/** Ticks in each of the ten boxes, 0 to 4. */
export function getBoxTicks(ticks: number): number[] {
  const clamped = clampTicks(ticks);
  return Array.from({ length: PROGRESS_BOXES }, (_, index) =>
    Math.min(Math.max(clamped - index * TICKS_PER_BOX, 0), TICKS_PER_BOX),
  );
}

export interface ProgressTextStrings {
  /** "3 of 10 boxes filled" */
  boxes: (boxes: number, total: number) => string;
  /** "3 of 10 boxes filled, and 2 of 4 ticks" */
  boxesAndTicks: (
    boxes: number,
    total: number,
    ticks: number,
    ticksPerBox: number,
  ) => string;
}

export function getProgressText(t: TFunction): ProgressTextStrings {
  return {
    boxes: (boxes, total) =>
      t("ui.progress.boxes", "{{boxes}} of {{total}} boxes filled", {
        boxes,
        total,
      }),
    boxesAndTicks: (boxes, total, ticks, ticksPerBox) =>
      t(
        "ui.progress.boxes-and-ticks",
        "{{boxes}} of {{total}} boxes filled, and {{ticks}} of {{ticksPerBox}} ticks",
        { boxes, total, ticks, ticksPerBox },
      ),
  };
}

/** Reads a track out as text, for aria-valuetext and announcements. */
export function getProgressValueText(
  ticks: number,
  strings: ProgressTextStrings,
): string {
  const { boxes, ticks: rest } = getProgressBoxes(ticks);
  return rest === 0
    ? strings.boxes(boxes, PROGRESS_BOXES)
    : strings.boxesAndTicks(boxes, PROGRESS_BOXES, rest, TICKS_PER_BOX);
}

/** "2 boxes per mark", "1 tick per mark": what one mark at a rank adds. */
export function describeMark(t: TFunction, ticks: number): string {
  if (ticks % TICKS_PER_BOX === 0) {
    return t("ui.progress.boxes-per-mark", "{{count}} boxes per mark", {
      count: ticks / TICKS_PER_BOX,
      defaultValue_one: "{{count}} box per mark",
    });
  }
  return t("ui.progress.ticks-per-mark", "{{count}} ticks per mark", {
    count: ticks,
    defaultValue_one: "{{count}} tick per mark",
  });
}
