import { ComponentProps } from "react";

import { css, cx } from "styled-system/css";

export const dialogActionsStyles = css({
  display: "flex",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: "2",
  paddingBlock: "4",
  paddingInline: "5",
  borderTop: "1px solid token(colors.border.subtle)",
  background: "bg.muted",
  borderBottomRadius: "xl",
  flex: "none",
  smDown: { "[data-full-screen] &": { borderRadius: 0 } },
});

export function DialogActions(props: ComponentProps<"div">) {
  const { className, ...rest } = props;
  return <div className={cx(dialogActionsStyles, className)} {...rest} />;
}
