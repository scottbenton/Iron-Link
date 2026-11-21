import { ReactNode } from "react";

import { css } from "styled-system/css";

const iconWellStyles = css({
  display: "grid",
  placeItems: "center",
  width: "44px",
  height: "44px",
  borderRadius: "md",
  border: "1px solid token(colors.border.subtle)",
  background: "bg.muted",
  color: "fg.muted",
  "& > svg": { width: "22px", height: "22px" },
});

export function IconWell(props: { children: ReactNode }) {
  return (
    <span className={iconWellStyles} aria-hidden>
      {props.children}
    </span>
  );
}
