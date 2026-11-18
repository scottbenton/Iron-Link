import { ComponentProps } from "react";

import { cx } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";

/** Content for screen readers only. */
export function VisuallyHidden(props: ComponentProps<"span">) {
  const { className, ...rest } = props;
  return <span className={cx(visuallyHidden(), className)} {...rest} />;
}
