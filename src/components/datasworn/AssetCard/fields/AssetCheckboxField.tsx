import { Checkbox } from "@/components/ui/checkbox";
import { Datasworn } from "@datasworn/core";

export interface AssetCheckboxFieldProps {
  field: Datasworn.AssetCheckboxField | Datasworn.AssetCardFlipField;
  value?: boolean;
  onChange?: (value: boolean) => void;
}

export function AssetCheckboxField(props: AssetCheckboxFieldProps) {
  const { field, value, onChange } = props;

  return (
    <Checkbox
      checked={value ?? field.value ?? false}
      disabled={!onChange}
      onCheckedChange={(details) =>
        onChange && onChange(details.checked === true)
      }
      textTransform={"capitalize"}
    >
      {field.label}
    </Checkbox>
  );
}
