import { InitiativeStatus } from "repositories/character.repository";

/**
 * The palette colour each initiative status wears, shared by the chip and the
 * phone sheet's segmented control so the two always agree.
 */
export const initiativeStatusColors: Record<
  InitiativeStatus,
  "success" | "error" | "primary"
> = {
  [InitiativeStatus.HasInitiative]: "success",
  [InitiativeStatus.DoesNotHaveInitiative]: "error",
  [InitiativeStatus.OutOfCombat]: "primary",
};
