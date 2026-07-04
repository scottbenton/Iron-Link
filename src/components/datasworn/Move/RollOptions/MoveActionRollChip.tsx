import { Datasworn } from "@datasworn-community/core";
import { Chip } from "@mui/material";

import {
  useConditionMeterRules,
  useStatRules,
} from "stores/dataswornTree.store";

export interface MoveActionRollChipProps {
  rollOption: Datasworn.RollableValue;
}

export function MoveActionRollChip(props: MoveActionRollChipProps) {
  const { rollOption } = props;

  const stats = useStatRules();
  const conditionMeters = useConditionMeterRules();

  if (rollOption.using === "stat" && stats[rollOption.stat]) {
    return (
      <Chip
        label={stats[rollOption.stat].label}
        sx={{ textTransform: "capitalize" }}
      />
    );
  }
  if (
    rollOption.using === "condition_meter" &&
    conditionMeters[rollOption.condition_meter]
  ) {
    return (
      <Chip
        label={conditionMeters[rollOption.condition_meter].label}
        sx={{ textTransform: "capitalize" }}
      />
    );
  }
  if (rollOption.using === "custom") {
    return (
      <Chip
        label={rollOption.label + ": " + rollOption.value}
        sx={{ textTransform: "capitalize" }}
      />
    );
  }

  console.error("Could not find rollOption", rollOption);
  return null;
}
