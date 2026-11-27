import { ComponentProps, ReactNode } from "react";

import { css, cx } from "styled-system/css";

export const dialogActionsStyles = css({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
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

const startStyles = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
  marginInlineEnd: "auto",
});

export interface DialogActionsProps extends ComponentProps<"div"> {
  /**
   * A button that sits apart at the start of the strip, such as Delete or
   * Reset beside Cancel and Save. The rest stay right-aligned.
   */
  start?: ReactNode;
}

/**
 * The footer strip every dialog ends with: buttons right-aligned, the main
 * one last. A dialog with nothing to submit ends with `DialogDoneButton`.
 */
export function DialogActions(props: DialogActionsProps) {
  const { className, start, children, ...rest } = props;
  return (
    <div className={cx(dialogActionsStyles, className)} {...rest}>
      {start && <div className={startStyles}>{start}</div>}
      {children}
    </div>
  );
}
