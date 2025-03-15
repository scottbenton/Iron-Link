import { TextField } from "@/components/common/TextField";
import { useDebouncedSync } from "@/hooks/useDebouncedSync";
import { Datasworn } from "@datasworn/core";
import { useCallback } from "react";

export interface AssetTextFieldProps {
  field: Datasworn.TextField;
  value?: string;
  onChange?: (value: string) => void;
}

export function AssetTextField(props: AssetTextFieldProps) {
  const { field, value: dbValue, onChange } = props;
  const { label, value: defaultValue } = field;

  const [value, setValue] = useDebouncedSync(
    useCallback(
      (val: string) => {
        onChange?.(val);
      },
      [onChange],
    ),
    dbValue ?? defaultValue ?? "",
  );

  return (
    <TextField
      w="100%"
      label={label}
      LabelProps={{ textTransform: "capitalize" }}
      InputProps={{ w: "100%" }}
      value={value}
      disabled={!onChange}
      onChange={setValue}
      mt={1}
      css={{
        "& .chakra-group": {
          w: "100%",
        },
      }}
    />
  );
}
