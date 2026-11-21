import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { ComponentProps, forwardRef } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cx } from "styled-system/css";

/** One bordered surface, the items divided by hairlines. */
const rootStyles = css({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  fontFamily: "body",
  color: "fg.default",
  border: "1px solid token(colors.border.default)",
  borderRadius: "lg",
  background: "bg.surface",
  overflow: "hidden",
});

type RootProps = ComponentProps<typeof BaseAccordion.Root>;

export interface AccordionProps extends Omit<RootProps, "className">, CssProp {
  className?: string;
}

/**
 * Sections that open and close under their headings. One opens at a time
 * unless `multiple`. The value is the open items' values, controlled with
 * `value`/`onValueChange` or uncontrolled with `defaultValue`.
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  function Accordion(props, ref) {
    const { className, ...rest } = withCssProp(props);
    return (
      <BaseAccordion.Root
        ref={ref}
        className={cx(rootStyles, className)}
        {...rest}
      />
    );
  },
);
