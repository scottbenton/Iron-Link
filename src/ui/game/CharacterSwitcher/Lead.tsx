import { ReactNode } from "react";

import { css } from "styled-system/css";

/** A 24px leading slot, so portraits and icons line up. */
const leadStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "3",
  minWidth: 0,
  "& > [data-part=lead]": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "none",
    width: "24px",
    height: "24px",
    color: "fg.muted",
  },
  "& > [data-part=lead] > svg": { width: "icon.md", height: "icon.md" },
  "& > [data-part=text]": {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

export function Lead(props: { lead?: ReactNode; children: ReactNode }) {
  return (
    <span className={leadStyles}>
      <span data-part="lead" aria-hidden>
        {props.lead}
      </span>
      <span data-part="text">{props.children}</span>
    </span>
  );
}
