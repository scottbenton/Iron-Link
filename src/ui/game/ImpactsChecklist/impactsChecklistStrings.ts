export interface ImpactsChecklistStrings {
  /** The section title: Ironsworn says "Debilities", the others "Impacts". */
  title: string;
  /** "2 marked", or "None marked". */
  count: (marked: number) => string;
}

export const impactsChecklistWording: Record<
  "ironsworn" | "starforged",
  ImpactsChecklistStrings
> = {
  ironsworn: {
    title: "Debilities",
    count: (marked) => (marked ? `${marked} marked` : "None marked"),
  },
  starforged: {
    title: "Impacts",
    count: (marked) => (marked ? `${marked} marked` : "None marked"),
  },
};
