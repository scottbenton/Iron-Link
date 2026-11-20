import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { ComponentProps, forwardRef } from "react";

import { css, cx } from "styled-system/css";

const itemStyles = css({
  boxSizing: "border-box",
  "& + &": { borderTop: "1px solid token(colors.border.subtle)" },
});

type ItemProps = ComponentProps<typeof BaseAccordion.Item>;

export interface AccordionItemProps extends Omit<ItemProps, "className"> {
  className?: string;
}

/** One section: an `AccordionTrigger` and an `AccordionPanel`. */
export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  function AccordionItem(props, ref) {
    const { className, ...rest } = props;
    return (
      <BaseAccordion.Item
        ref={ref}
        className={cx(itemStyles, className)}
        {...rest}
      />
    );
  },
);
