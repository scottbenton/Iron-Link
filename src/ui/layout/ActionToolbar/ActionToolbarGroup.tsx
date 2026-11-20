import { Toolbar } from "@base-ui/react/toolbar";
import { ComponentProps } from "react";

import { css, cx } from "styled-system/css";

import { CssProp, withCssProp } from "../../styles/cssProp";

const groupStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "0.5",
});

/** Actions that belong together, such as text formatting. */
export function ActionToolbarGroup(
  props: Omit<ComponentProps<typeof Toolbar.Group>, "className"> &
    CssProp & {
      className?: string;
    },
) {
  const { className, ...rest } = withCssProp(props);
  return <Toolbar.Group className={cx(groupStyles, className)} {...rest} />;
}
