import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { ComponentProps, ReactNode } from "react";

import { css, cx } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";

import { fieldLabelRecipe, fieldRequiredStyles } from "./fieldStyles";
import { FieldSize } from "./fieldTypes";

const legendStyles = css({
  marginBottom: "1",
});

export interface FieldsetLegendProps
  extends Omit<ComponentProps<typeof BaseFieldset.Legend>, "className"> {
  className?: string;
  required?: boolean;
  requiredIndicator?: ReactNode;
  hidden?: boolean;
  size?: FieldSize;
}

/** A fieldset's legend, styled like a field label. */
export function FieldsetLegend(props: FieldsetLegendProps) {
  const {
    className,
    required,
    requiredIndicator = "*",
    hidden,
    size = "md",
    children,
    ...rest
  } = props;
  return (
    <BaseFieldset.Legend
      className={cx(
        fieldLabelRecipe({ size }),
        legendStyles,
        hidden && visuallyHidden(),
        className,
      )}
      {...rest}
    >
      {children}
      {required && (
        <span className={fieldRequiredStyles} aria-hidden>
          {requiredIndicator}
        </span>
      )}
    </BaseFieldset.Legend>
  );
}
