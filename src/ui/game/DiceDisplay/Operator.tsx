import { ReactNode } from "react";

import { css } from "styled-system/css";

const operatorStyles = css({
  display: "grid",
  placeItems: "center",
  height: "var(--die-size)",
  color: "fg.subtle",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "var(--die-font)",
  "&[data-word]": {
    fontSize: "xs",
    textTransform: "uppercase",
    letterSpacing: "label",
  },
});

export function Operator(props: { children: ReactNode; word?: boolean }) {
  return (
    <span className={operatorStyles} data-word={props.word || undefined}>
      {props.children}
    </span>
  );
}
