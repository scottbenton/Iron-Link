import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { createListCollection } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";
import { useMemo } from "react";

export interface AssetSelectValueFieldProps {
  field: Datasworn.SelectValueField;
  value?: string;
  onChange?: (value: string) => void;
}

export function AssetSelectValueField(props: AssetSelectValueFieldProps) {
  const { field, value, onChange } = props;
  const { label, value: defaultValue, choices } = field;

  const { collection, items } = useMemo(() => {
    const items: {
      label: string;
      value: string;
    }[] = [];

    Object.entries(choices).forEach(([choiceKey, choice]) => {
      items.push({
        label: choice.label,
        value: choiceKey,
      });
    });

    const collection = createListCollection({
      items,
    });

    return {
      collection,
      items,
    };
  }, [choices]);

  return (
    <SelectRoot
      w="100%"
      collection={collection}
      value={[value ?? defaultValue ?? ""]}
      onValueChange={(details) => onChange && onChange(details.value[0])}
      disabled={!onChange}
    >
      <SelectLabel textTransform={"capitalize"}>{label}</SelectLabel>
      <SelectTrigger>
        <SelectValueText textTransform={"capitalize"} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} item={item} textTransform={"capitalize"}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}
