import { Radio as BaseRadio } from "@base-ui/react/radio";
import { ReactNode, Ref, useContext } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { ChoiceItem, choiceBoxStyles, radioDotStyles } from "../Checkbox";
import { RadioSizeContext } from "./radioSizeContext";

export interface RadioProps<V = string> extends CssProp {
  /** What choosing this radio sets the group to. */
  value: V;
  /** The text beside the circle, and the radio's name. Pressing it chooses. */
  label?: ReactNode;
  /**
   * A muted line under the label, read as the radio's description. Pressing
   * it chooses too.
   */
  description?: ReactNode;
  disabled?: boolean;
  /** Names the radio when there is no visible label. */
  "aria-label"?: string;
  className?: string;
  ref?: Ref<HTMLElement>;
}

/** One choice in a RadioGroup. */
export function Radio<V = string>(props: RadioProps<V>) {
  const {
    value,
    label,
    description,
    disabled,
    "aria-label": ariaLabel,
    className,
    ref,
  } = withCssProp(props);
  const size = useContext(RadioSizeContext);
  return (
    <ChoiceItem
      className={className}
      disabled={disabled}
      size={size}
      label={label}
      description={description}
      hasAriaLabel={Boolean(ariaLabel)}
      control={(labelledBy) => (
        <BaseRadio.Root
          ref={ref}
          value={value}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          className={choiceBoxStyles({ shape: "radio", size })}
        >
          <BaseRadio.Indicator keepMounted className={radioDotStyles} />
        </BaseRadio.Root>
      )}
    />
  );
}
