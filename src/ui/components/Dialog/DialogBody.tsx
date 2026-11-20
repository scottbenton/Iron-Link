import { ComponentProps } from "react";

import { css, cx } from "styled-system/css";

export const dialogBodyStyles = css({
  display: "grid",
  alignContent: "start",
  gap: "4",
  paddingBlock: "3",
  paddingInline: "5",
  paddingBlockEnd: "5",
  overflowY: "auto",
  minHeight: 0,
  flex: "1 1 auto",
});

export function DialogBody(props: ComponentProps<"div">) {
  const { className, ...rest } = props;
  return <div className={cx(dialogBodyStyles, className)} {...rest} />;
}
