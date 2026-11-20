import { ReactNode } from "react";

/** Whether an `error` prop marks the field invalid, and its message. */
export function resolveFieldError(error: ReactNode, invalid?: boolean) {
  const hasError =
    error !== undefined && error !== null && error !== false && error !== "";
  return {
    invalid: Boolean(invalid) || hasError,
    message: hasError && error !== true ? error : undefined,
  };
}
