import { Tag } from "@/components/ui/tag";
import {
  useConditionMeterRules,
  useStatRules,
} from "@/stores/dataswornTree.store";
import { Datasworn } from "@datasworn/core";

export interface MoveActionRollChipProps {
  rollOption: Datasworn.RollableValue;
}

export function MoveActionRollChip(props: MoveActionRollChipProps) {
  const { rollOption } = props;

  const stats = useStatRules();
  const conditionMeters = useConditionMeterRules();

  if (rollOption.using === "stat" && stats[rollOption.stat]) {
    return (
      <Tag textTransform={"capitalize"}>{stats[rollOption.stat].label}</Tag>
    );
  }
  if (
    rollOption.using === "condition_meter" &&
    conditionMeters[rollOption.condition_meter]
  ) {
    return (
      <Tag textTransform={"capitalize"}>
        {conditionMeters[rollOption.condition_meter].label}
      </Tag>
    );
  }
  if (rollOption.using === "custom") {
    return (
      <Tag textTransform={"capitalize"}>
        {rollOption.label + ": " + rollOption.value}
      </Tag>
    );
  }

  console.error("Could not find rollOption", rollOption);
  return null;
}
