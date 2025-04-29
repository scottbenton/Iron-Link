import {
  SelectContent,
  SelectItem,
  SelectItemGroup,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { Select as CSelect, createListCollection } from "@chakra-ui/react";
import { Fragment, forwardRef, useMemo } from "react";

import { useDialogPortalRef } from "../Dialog/DialogContentRefContext";

export interface SelectProps
  extends Omit<CSelect.RootProps, "value" | "collection" | "onChange"> {
  label?: React.ReactNode;
  optionalText?: React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string; group?: string }[];
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  function Select(props, ref) {
    const { value, label, options, onChange, ...rootProps } = props;
    const portalRef = useDialogPortalRef();

    const { collection, items } = useMemo(() => {
      const groupedItems: {
        groupLabel: string | null;
        items: {
          label: string;
          value: string;
        }[];
      }[] = [];

      options.forEach((option) => {
        if (
          groupedItems.length === 0 ||
          option.group !== groupedItems[groupedItems.length - 1].groupLabel
        ) {
          groupedItems.push({
            groupLabel: option.group ?? null,
            items: [
              {
                label: option.label,
                value: option.value,
              },
            ],
          });
        } else {
          groupedItems[groupedItems.length - 1].items.push({
            label: option.label,
            value: option.value,
          });
        }
      });
      return {
        collection: createListCollection({ items: options }),
        items: groupedItems,
      };
    }, [options]);

    return (
      <SelectRoot
        ref={ref}
        collection={collection}
        value={[value ?? ""]}
        onValueChange={(details) => onChange && onChange(details.value[0])}
        {...rootProps}
      >
        {label && <SelectLabel>{label}</SelectLabel>}
        <SelectTrigger>
          <SelectValueText textTransform={"capitalize"} />
        </SelectTrigger>
        <SelectContent portalRef={portalRef ?? undefined}>
          {items.map((group, idx, arr) =>
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
  },
);
