import { TextField } from "@/components/common/TextField";
import { Datasworn } from "@datasworn/core";

export interface AssetTextFieldProps {
  field: Datasworn.TextField;
  value?: string;
  onChange?: (value: string) => void;
}

export function AssetTextField(props: AssetTextFieldProps) {
  const { field, value, onChange } = props;
  const { label, value: defaultValue } = field;

  return (
    <TextField
      w="100%"
      label={label}
      LabelProps={{ textTransform: "capitalize" }}
      InputProps={{ w: "100%" }}
      defaultValue={value ?? defaultValue ?? ""}
      disabled={!onChange}
      onChange={onChange}
      mt={1}
      css={{
        "& .chakra-group": {
          w: "100%",
        },
      }}
    />
  );
}
