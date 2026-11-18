/** The statuses Iron Link has today. Datasworn may bring others. */
export type InitiativeStatus = "hasInitiative" | "noInitiative" | "outOfCombat";

/**
 * Starforged and Sundered Isles say In Control and In a Bad Spot; Ironsworn
 * says Has Initiative and No Initiative.
 */
export type InitiativeWording = "ironsworn" | "starforged";

/**
 * One status the chip can show. The chip reads nothing into the value: it
 * shows the label, and draws `resting` statuses (Out of Combat) quieter than
 * the rest. Nothing is coloured as good or bad, so statuses from rules data
 * can be shown as they come.
 */
export interface InitiativeOption<T extends string = string> {
  value: T;
  label: string;
  /** The status outside a fight. Drawn muted, with a hollow dot. */
  resting?: boolean;
}

export const initiativeLabels: Record<
  InitiativeWording,
  Record<InitiativeStatus, string>
> = {
  ironsworn: {
    hasInitiative: "Has Initiative",
    noInitiative: "No Initiative",
    outOfCombat: "Out of Combat",
  },
  starforged: {
    hasInitiative: "In Control",
    noInitiative: "In a Bad Spot",
    outOfCombat: "Out of Combat",
  },
};

const order: InitiativeStatus[] = [
  "hasInitiative",
  "noInitiative",
  "outOfCombat",
];

/** The built-in statuses as options, in menu order, with a game's words. */
export function getInitiativeOptions(
  wording: InitiativeWording = "starforged",
  labels?: Partial<Record<InitiativeStatus, string>>,
): InitiativeOption<InitiativeStatus>[] {
  const words = { ...initiativeLabels[wording], ...labels };
  return order.map((value) => ({
    value,
    label: words[value],
    resting: value === "outOfCombat",
  }));
}
