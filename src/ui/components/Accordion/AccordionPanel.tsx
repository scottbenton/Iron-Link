import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { ComponentProps, forwardRef } from "react";

import { css, cx } from "styled-system/css";

const panelStyles = css({
  overflow: "hidden",
  boxSizing: "border-box",
  height: "var(--accordion-panel-height)",
  transitionProperty: "height",
  transitionDuration: "normal",
  transitionTimingFunction: "out",
  _startingStyle: { height: 0 },
  _endingStyle: {
    height: 0,
    transitionDuration: "fast",
    transitionTimingFunction: "in",
  },
  "&[hidden]:not([hidden=until-found])": { display: "none" },
  _reducedMotion: { transitionDuration: "0s" },
});

const panelContentStyles = css({
  paddingInline: "4",
  paddingBottom: "4",
  paddingTop: "1",
  fontSize: "sm",
  lineHeight: "normal",
  color: "fg.default",
});

type PanelProps = ComponentProps<typeof BaseAccordion.Panel>;

export interface AccordionPanelProps extends Omit<PanelProps, "className"> {
  className?: string;
}

/** A section's content. Its height animates as it opens and closes. */
export const AccordionPanel = forwardRef<HTMLDivElement, AccordionPanelProps>(
  function AccordionPanel(props, ref) {
    const { className, children, ...rest } = props;
    return (
      <BaseAccordion.Panel ref={ref} className={panelStyles} {...rest}>
        <div className={cx(panelContentStyles, className)}>{children}</div>
      </BaseAccordion.Panel>
    );
  },
);
