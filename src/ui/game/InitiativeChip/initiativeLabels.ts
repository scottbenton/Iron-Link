import type { TFunction } from "i18next";

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
  /** The status outside a fight. Drawn muted. */
  resting?: boolean;
}

/** Each game's words for the built-in statuses. */
export function getInitiativeLabels(
  t: TFunction,
): Record<InitiativeWording, Record<InitiativeStatus, string>> {
  const outOfCombat = t("ui.initiative.out-of-combat", "Out of Combat");
  return {
    ironsworn: {
      hasInitiative: t("ui.initiative.has-initiative", "Has Initiative"),
      noInitiative: t("ui.initiative.no-initiative", "No Initiative"),
      outOfCombat,
    },
    starforged: {
      hasInitiative: t("ui.initiative.in-control", "In Control"),
      noInitiative: t("ui.initiative.in-a-bad-spot", "In a Bad Spot"),
      outOfCombat,
    },
  };
}

const order: InitiativeStatus[] = [
  "hasInitiative",
  "noInitiative",
  "outOfCombat",
];

/** The built-in statuses as options, in menu order, with a game's words. */
export function getInitiativeOptions(
  t: TFunction,
  wording: InitiativeWording = "starforged",
  labels?: Partial<Record<InitiativeStatus, string>>,
): InitiativeOption<InitiativeStatus>[] {
  const words = { ...getInitiativeLabels(t)[wording], ...labels };
  return order.map((value) => ({
    value,
    label: words[value],
    resting: value === "outOfCombat",
  }));
}
