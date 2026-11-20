import { Toolbar } from "@base-ui/react/toolbar";

import { css } from "styled-system/css";

const separatorStyles = css({
  flex: "none",
  alignSelf: "stretch",
  width: "1px",
  marginBlock: "1",
  marginInline: "1",
  background: "border.default",
});

/** A thin rule between groups of actions. */
export function ActionToolbarSeparator() {
  return <Toolbar.Separator className={separatorStyles} />;
}
