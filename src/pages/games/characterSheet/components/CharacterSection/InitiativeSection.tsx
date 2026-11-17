import { InitiativeSegmentedControl } from "components/datasworn/InitiativeStatusChip";

import { useCharacterInitiativeStatus } from "./useCharacterInitiativeStatus";

/** The phone sheet's initiative, at the top of the Overview tab. */
export function InitiativeSection() {
  const { status, handleStatusChange } = useCharacterInitiativeStatus();

  return (
    <InitiativeSegmentedControl
      status={status}
      handleStatusChange={handleStatusChange}
    />
  );
}
