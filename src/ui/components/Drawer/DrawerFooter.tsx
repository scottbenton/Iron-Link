import { ComponentProps } from "react";

import { css, cx } from "styled-system/css";

const footerStyles = css({
  display: "flex",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: "2",
  flex: "none",
  paddingBlock: "4",
  paddingInline: "5",
  borderTop: "1px solid token(colors.border.subtle)",
  background: "bg.muted",
  "[data-placement=bottom] > &": {
    paddingBlockEnd:
      "calc(token(spacing.4) + env(safe-area-inset-bottom, 0px))",
  },
  "[data-placement=left] > &": { borderEndEndRadius: "xl" },
  "[data-placement=right] > &": { borderEndStartRadius: "xl" },
});

/** Actions pinned under the body. */
export function DrawerFooter(props: ComponentProps<"div">) {
  const { className, ...rest } = props;
  return <div className={cx(footerStyles, className)} {...rest} />;
}
