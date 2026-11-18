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

export const impactsSummaryWording: Record<
  "ironsworn" | "starforged",
  ImpactsSummaryStrings
> = {
  ironsworn: {
    activeLabel: "Active Debilities",
    none: "None",
    edit: "Edit Debilities",
    done: "Done",
    saveError: (impact) =>
      `${impact} could not be saved, so it is back as it was. Try again.`,
    dismissError: "Dismiss",
  },
  starforged: {
    activeLabel: "Active Impacts",
    none: "None",
    edit: "Edit Impacts",
    done: "Done",
    saveError: (impact) =>
      `${impact} could not be saved, so it is back as it was. Try again.`,
    dismissError: "Dismiss",
  },
};
