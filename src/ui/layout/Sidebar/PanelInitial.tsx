import { ReactNode } from "react";

import { css } from "styled-system/css";

const initialStyles = css({
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "md",
  lineHeight: "none",
});

/** The first letter of a panel without an icon, for the collapsed rail. */
export function PanelInitial(props: { title: string }): ReactNode {
  return (
    <span className={initialStyles} aria-hidden="true">
      {props.title.trim().charAt(0).toUpperCase()}
    </span>
  );
}
