import { ReactNode } from "react";

import { css } from "styled-system/css";

const phoneFrameStyles = css({
  boxSizing: "border-box",
  width: "390px",
  maxWidth: "100%",
  height: "760px",
  marginInline: "auto",
  border: "1px solid token(colors.border.default)",
  borderRadius: "xl",
  overflow: "auto",
  background: "bg.canvas",
  boxShadow: "float",
  "--app-shell-height": "100%",
});

/**
 * A phone-sized box. Layout components switch on the shell's own width, so
 * the shell inside takes the phone layout at any window size.
 */
export function PhoneFrame(props: { children: ReactNode }) {
  return <div className={phoneFrameStyles}>{props.children}</div>;
}
