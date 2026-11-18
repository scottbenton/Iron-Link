export type InitiativeStatus = "hasInitiative" | "noInitiative" | "outOfCombat";

/**
 * Starforged and Sundered Isles say In Control and In a Bad Spot; Ironsworn
 * says Has Initiative and No Initiative.
 */
export type InitiativeWording = "ironsworn" | "starforged";

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
