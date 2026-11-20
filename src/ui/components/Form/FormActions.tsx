import { ReactNode } from "react";

import { css, cx } from "styled-system/css";

/** A row of buttons at the end of a form, the main action last. */
export function FormActions(props: {
  children: ReactNode;
  className?: string;
}) {
  const { children, className } = props;
  return (
    <div
      className={cx(
        css({
          display: "flex",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: "2",
          marginTop: "2",
        }),
        className,
      )}
    >
      {children}
    </div>
  );
}
