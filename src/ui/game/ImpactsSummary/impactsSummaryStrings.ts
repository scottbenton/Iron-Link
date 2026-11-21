import type { TFunction } from "i18next";

export interface ImpactsSummaryStrings {
  /** The card's label over the marked impacts. */
  activeLabel: string;
  /** Shown when nothing is marked. */
  none: string;
  /** The Edit button's name and the dialog's title. */
  edit: string;
  /** Closes the dialog; every tick is already saved. */
  done: string;
  /** Shown in the dialog when a tick fails to save, from the impact's name. */
  saveError: (impact: string) => string;
  /** Names the error's dismiss button. */
  dismissError: string;
}

/** Ironsworn says "Debilities", the others "Impacts". */
export function getImpactsSummaryWording(
  t: TFunction,
  wording: "ironsworn" | "starforged",
): ImpactsSummaryStrings {
  const shared = {
    none: t("ui.impacts-summary.none", "None"),
    done: t("ui.impacts-summary.done", "Done"),
    saveError: (impact: string) =>
      t(
        "ui.impacts-summary.save-error",
        "{{impact}} could not be saved, so it is back as it was. Try again.",
        { impact },
      ),
    dismissError: t("ui.common.dismiss", "Dismiss"),
  };
  return wording === "ironsworn"
    ? {
        ...shared,
        activeLabel: t(
          "ui.impacts-summary.active-debilities",
          "Active Debilities",
        ),
        edit: t("ui.impacts-summary.edit-debilities", "Edit Debilities"),
      }
    : {
        ...shared,
        activeLabel: t("ui.impacts-summary.active-impacts", "Active Impacts"),
        edit: t("ui.impacts-summary.edit-impacts", "Edit Impacts"),
      };
}
