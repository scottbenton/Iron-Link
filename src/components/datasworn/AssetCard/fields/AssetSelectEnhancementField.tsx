import {
  SelectContent,
  SelectItem,
  SelectItemGroup,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { createListCollection } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";
import { Fragment, useMemo } from "react";

export interface AssetSelectEnhancementFieldProps {
  field: Datasworn.SelectEnhancementField;
  value?: string;
  onChange?: (value: string) => void;
}

export function AssetSelectEnhancementField(
  props: AssetSelectEnhancementFieldProps,
) {
  const { field, value, onChange } = props;
  const { label, value: defaultValue, choices } = field;

  const { groupedItems, items } = useMemo(() => {
    const groupedItems: {
      groupLabel: string | null;
      items: {
        label: string;
        value: string;
      }[];
    }[] = [];

    let needsNewGroup = true;
    Object.entries(choices).forEach(([choiceKey, choice]) => {
      if (choice.choice_type === "choice_group") {
        needsNewGroup = true;
        groupedItems.push({
          groupLabel: choice.name,
          items: Object.entries(choice.choices).map(
            ([subChoiceKey, subChoice]) => ({
              label: subChoice.label,
              value: subChoiceKey,
            }),
          ),
        });
      } else {
        if (needsNewGroup) {
          needsNewGroup = false;
          groupedItems.push({
            groupLabel: null,
            items: [],
          });
        }
        groupedItems[groupedItems.length - 1].items.push({
          label: choice.label,
          value: choiceKey,
        });
      }
    });

    const items = createListCollection({
      items: groupedItems.flatMap((group) => [
        ...group.items.map((item) => ({
          ...item,
          group: group.groupLabel,
        })),
      ]),
    });

    return { groupedItems, items };
  }, [choices]);

  return (
    <SelectRoot
      collection={items}
      value={[value ?? defaultValue ?? ""]}
      onValueChange={(details) => onChange && onChange(details.value[0])}
    >
      <SelectLabel textTransform={"capitalize"}>{label}</SelectLabel>
      <SelectTrigger>
        <SelectValueText textTransform={"capitalize"} />
      </SelectTrigger>
      <SelectContent>
        {groupedItems.map((group, idx, arr) =>
          arr.length > 1 ? (
            <Fragment key={idx}>
              {group.items.map((item) => (
                <SelectItem
                  key={item.value}
                  item={item}
                  textTransform={"capitalize"}
                >
                  {item.label}
                </SelectItem>
              ))}
            </Fragment>
          ) : (
            <SelectItemGroup
              key={idx}
              label={group.groupLabel}
              textTransform={"capitalize"}
            >
              {group.items.map((item) => (
                <SelectItem
                  key={item.value}
                  item={item}
                  textTransform={"capitalize"}
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectItemGroup>
          ),
        )}
      </SelectContent>
    </SelectRoot>
  );
}
