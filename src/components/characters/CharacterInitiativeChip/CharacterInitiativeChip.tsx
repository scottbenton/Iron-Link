import { InitiativeChip, InitiativeOption } from "ui/game/InitiativeChip";

import { useOptimisticValue } from "hooks/useOptimisticValue";

import { InitiativeStatus } from "repositories/character.repository";

import { useInitiativeStatusText } from "./useInitiativeStatusText";

const order = [
  InitiativeStatus.HasInitiative,
  InitiativeStatus.DoesNotHaveInitiative,
  InitiativeStatus.OutOfCombat,
];

export interface CharacterInitiativeChipProps {
  status: InitiativeStatus | undefined;
  /**
   * Saves a new status, which the chip shows at once. Without it the chip
   * only shows the status.
   */
  onStatusChange?: (status: InitiativeStatus) => Promise<unknown>;
}

// A character's initiative in the active rules' words (In Control in
// Starforged, Has Initiative in Ironsworn).
export function CharacterInitiativeChip(props: CharacterInitiativeChipProps) {
  const { status: savedStatus, onStatusChange } = props;
  const [status, changeStatus] = useOptimisticValue(
    savedStatus ?? InitiativeStatus.OutOfCombat,
    onStatusChange,
  );
  const labels = useInitiativeStatusText(true);

  const options: InitiativeOption<InitiativeStatus>[] = order.map((value) => ({
    value,
    label: labels[value],
    resting: value === InitiativeStatus.OutOfCombat,
  }));

  return (
    <InitiativeChip
      status={status}
      options={options}
      onStatusChange={changeStatus}
    />
  );
}
