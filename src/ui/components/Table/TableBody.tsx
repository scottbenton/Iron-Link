import { ComponentProps } from "react";

import { css, cx } from "styled-system/css";

const bodyStyles = css({
  "& > tr + tr > :is(td, th)": {
    borderTop: "1px solid token(colors.border.subtle)",
  },
});

export function TableBody(props: ComponentProps<"tbody">) {
  const { className, ...rest } = props;
  return <tbody className={cx(bodyStyles, className)} {...rest} />;
}
