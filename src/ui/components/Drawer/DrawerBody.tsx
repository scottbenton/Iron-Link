import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { ComponentProps } from "react";

import { css, cx } from "styled-system/css";

const bodyStyles = css({
  display: "grid",
  alignContent: "start",
  gap: "3",
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
  overscrollBehavior: "contain",
  paddingBlockStart: "2",
  paddingBlockEnd: "4",
  paddingInline: "5",
  // The last thing in a bottom sheet clears the home indicator.
  "[data-placement=bottom] > &": {
    "&:last-child": {
      paddingBlockEnd:
        "calc(token(spacing.4) + env(safe-area-inset-bottom, 0px))",
    },
  },
});

/**
 * The scrolling middle. Text in it can be selected with a mouse without
 * starting a swipe.
 */
export function DrawerBody(props: ComponentProps<"div">) {
  const { className, ...rest } = props;
  return <BaseDrawer.Content className={cx(bodyStyles, className)} {...rest} />;
}
