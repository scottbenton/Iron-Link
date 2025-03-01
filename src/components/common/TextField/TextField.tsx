import { InputGroup } from "@/components/ui/input-group";
import { Input, InputProps } from "@chakra-ui/react";
import { ChangeEvent, ReactNode, forwardRef, useCallback } from "react";

import { Field, FieldProps } from "./Field";

export interface TextFieldProps extends Omit<FieldProps, "label" | "onChange"> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  errorText?: React.ReactNode;
  optionalText?: React.ReactNode;
  FieldProps?: Partial<FieldProps>;
  InputProps?: Omit<InputProps, "onChange">;
  startElement?: ReactNode;
  endElement?: ReactNode;
  onChange?: (value: string) => void;
}

export const TextField = forwardRef<HTMLDivElement, TextFieldProps>(
  function TextField(props, ref) {
    const { onChange, InputProps, startElement, endElement, ...fieldProps } =
      props;

    const handleChange = useCallback(
      (evt: ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
          onChange(evt.target.value);
        }
      },
      [onChange],
    );
    return (
      <Field {...fieldProps} ref={ref}>
        <InputGroup
          flex="1"
          startElement={startElement}
          endElement={endElement}
        >
          <Input onChange={handleChange} {...InputProps} />
        </InputGroup>
      </Field>
    );
  },
);
