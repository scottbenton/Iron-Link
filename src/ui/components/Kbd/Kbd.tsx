import { ComponentProps, Fragment } from "react";

import { css, cx } from "styled-system/css";

const kbdStyles = css({
  display: "inline-grid",
  placeItems: "center",
  boxSizing: "border-box",
  minWidth: "1.6em",
  height: "1.6em",
  paddingInline: "0.4em",
  border: "1px solid token(colors.border.control)",
  borderRadius: "xs",
  background: "bg.surface",
  boxShadow: "0 1px 0 token(colors.border.control)",
  color: "fg.muted",
  fontFamily: "body",
  fontWeight: "semibold",
  fontSize: "xs",
  lineHeight: 1,
  whiteSpace: "nowrap",
  verticalAlign: "baseline",
});

/** One key, as in a keyboard hint: "Press Delete to close the note". */
export function Kbd(props: ComponentProps<"kbd">) {
  const { className, ...rest } = props;
  return <kbd className={cx(kbdStyles, className)} {...rest} />;
}

export interface KbdComboProps extends Omit<ComponentProps<"kbd">, "children"> {
  /** The keys pressed together, such as ["Ctrl", "K"]. */
  keys: string[];
  /** Read between the keys; shown as a plus. */
  separator?: string;
}

/** Keys pressed together, such as Ctrl + K. */
export function KbdCombo(props: KbdComboProps) {
  const { keys, separator = "+", className, ...rest } = props;
  return (
    <kbd
      className={cx(
        css({
          display: "inline-flex",
          alignItems: "center",
          gap: "1",
          fontFamily: "body",
          fontSize: "xs",
          color: "fg.subtle",
        }),
        className,
      )}
      {...rest}
    >
      {keys.map((key, index) => (
        <Fragment key={`${key}-${index}`}>
          {index > 0 && <span>{separator}</span>}
          <kbd className={kbdStyles}>{key}</kbd>
        </Fragment>
      ))}
    </kbd>
  );
}
