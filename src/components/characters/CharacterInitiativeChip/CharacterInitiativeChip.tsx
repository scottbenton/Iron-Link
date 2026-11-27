import { InitiativeChip, InitiativeOption } from "ui/game/InitiativeChip";

import { InitiativeStatus } from "repositories/character.repository";

import { useInitiativeStatusText } from "./useInitiativeStatusText";

const order = [
  InitiativeStatus.HasInitiative,
  InitiativeStatus.DoesNotHaveInitiative,
  InitiativeStatus.OutOfCombat,
];

export interface CharacterInitiativeChipProps {
  status: InitiativeStatus | undefined;
  /** Lets the chip change the status. Without it the chip only shows it. */
  onStatusChange?: (status: InitiativeStatus) => void;
}

// A character's initiative in the active rules' words (In Control in
// Starforged, Has Initiative in Ironsworn).
export function CharacterInitiativeChip(props: CharacterInitiativeChipProps) {
  const { status, onStatusChange } = props;
  const labels = useInitiativeStatusText(true);

  const options: InitiativeOption<InitiativeStatus>[] = order.map((value) => ({
    value,
    label: labels[value],
    resting: value === InitiativeStatus.OutOfCombat,
  }));

  return (
    <InitiativeChip
      status={status ?? InitiativeStatus.OutOfCombat}
      options={options}
      onStatusChange={onStatusChange}
    />
  );
}
