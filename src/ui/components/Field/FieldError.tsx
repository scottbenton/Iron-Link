import { Field as BaseField } from "@base-ui/react/field";
import { WarningCircle } from "@phosphor-icons/react";
import { ComponentProps, ReactNode } from "react";

import { cx } from "styled-system/css";

import { fieldErrorStyles } from "./fieldStyles";

export interface FieldErrorProps {
  /**
   * The message. When given it always shows; without it the error shows
   * Base UI's validation message (from `validate` or the native checks).
   */
  children?: ReactNode;
  /** Show only for one native validity state, such as `"valueMissing"`. */
  match?: ComponentProps<typeof BaseField.Error>["match"];
  className?: string;
}

/**
 * An error message with a warning icon, placed after the control. It joins the control's description
 * while shown, rises in gently and fades out.
 */
export function FieldError(props: FieldErrorProps) {
  const { children, match, className } = props;
  const hasMessage =
    children !== undefined && children !== null && children !== false;
  return (
    <BaseField.Error
      className={cx(fieldErrorStyles, className)}
      match={hasMessage ? true : match}
      {...(hasMessage ? { children } : {})}
      render={(errorProps) => {
        const { children: message, ...restProps } = errorProps;
        if (message === undefined || message === null || message === "") {
          // Invalid with nothing to say: keep the element, show nothing.
          return <div {...restProps} hidden />;
        }
        return (
          <div {...restProps}>
            <WarningCircle aria-hidden weight="bold" />
            <span>{message}</span>
          </div>
        );
      }}
    />
  );
}
