import type { TFunction } from "i18next";

export interface ImpactsChecklistStrings {
  /** The section title: Ironsworn says "Debilities", the others "Impacts". */
  title: string;
  /** "2 marked", or "None marked". */
  count: (marked: number) => string;
}

/** Ironsworn says "Debilities", the others "Impacts". */
export function getImpactsChecklistWording(
  t: TFunction,
  wording: "ironsworn" | "starforged",
): ImpactsChecklistStrings {
  const count = (marked: number) =>
    marked
      ? t("ui.impacts-checklist.marked", "{{count}} marked", { count: marked })
      : t("ui.impacts-checklist.none-marked", "None marked");
  return wording === "ironsworn"
    ? { title: t("ui.impacts-checklist.debilities", "Debilities"), count }
    : { title: t("ui.impacts-checklist.impacts", "Impacts"), count };
}
