import { useDebouncedSync } from "@/hooks/useDebouncedSync";

import { OracleTextField, OracleTextFieldProps } from "./OracleTextField";

export function DebouncedOracleTextField(props: OracleTextFieldProps) {
  const { value: nonDebouncedValue, onChange, ...textFieldProps } = props;
  const [value, setValue] = useDebouncedSync(onChange, nonDebouncedValue ?? "");

  return (
    <OracleTextField value={value} onChange={setValue} {...textFieldProps} />
  );
}
