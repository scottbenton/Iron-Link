import { Button as BaseButton } from "@base-ui/react/button";
import { Collapsible } from "@base-ui/react/collapsible";
import type { Datasworn } from "@datasworn-community/core";
import { CaretDown } from "@phosphor-icons/react";
import {
  ComponentPropsWithoutRef,
  ElementType,
  ReactElement,
  ReactNode,
  useState,
} from "react";

import { css, cx } from "styled-system/css";

import { MoveCard, MoveCardProps } from "../MoveCard/MoveCard";
import {
  collapsiblePanelStyles,
  disclosureChevronStyles,
} from "../MoveCard/cardStyles";
import { oracleRowStyles } from "../OracleListItem/OracleListItem";

const wrapperStyles = css({
  listStyle: "none",
  margin: 0,
  padding: 0,
  minWidth: 0,
});

const rowLineStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "0.5",
  minWidth: 0,
});

const rowStyles = css({
  "&[aria-expanded=true]": {
    background: "overlay.selected",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  "& [data-row-chevron]": {
    flex: "none",
    marginInlineStart: "auto",
    color: "fg.muted",
  },
});

const bodyStyles = css({
  paddingInline: "2.5",
  paddingBlock: "3",
  borderBottomLeftRadius: "md",
  borderBottomRightRadius: "md",
  background: "bg.muted",
  borderWidth: "1px",
  borderTopWidth: 0,
  borderStyle: "solid",
  borderColor: "border.subtle",
});

export interface MoveListItemProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  move: Datasworn.AnyMove;
  /** Opens the move in place below the row. */
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Props for the move shown when the row opens: roll options, handlers. */
  moveCardProps?: Omit<MoveCardProps, "move">;
  /**
   * Render the row as a link instead, such as a reference page:
   * `render={<Link to={href} />}`. It no longer opens in place.
   */
  render?: ReactElement;
  /** Marks the row as the open page (aria-current). */
  current?: boolean;
  /** A control beside the row, such as Pin. */
  secondaryAction?: ReactNode;
  disabled?: boolean;
  /** The wrapper element; `li` inside a list. */
  as?: ElementType;
  className?: string;
}

/**
 * A move as a list row. Pressing it opens the move below the row with its
 * roll buttons; in link mode it goes to the move's page instead.
 */
export function MoveListItem(props: MoveListItemProps) {
  const {
    move,
    expanded: expandedProp,
    defaultExpanded = false,
    onExpandedChange,
    moveCardProps,
    render,
    current,
    secondaryAction,
    disabled,
    as: Wrapper = "div",
    className,
    ...rest
  } = props;

  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const expanded = expandedProp ?? expandedState;

  if (render) {
    return (
      <Wrapper className={cx(wrapperStyles, className)} {...rest}>
        <div className={rowLineStyles}>
          <BaseButton
            className={oracleRowStyles}
            render={render}
            nativeButton={false}
            disabled={disabled}
            aria-current={current ? "page" : undefined}
          >
            <span data-row-name="">{move.name}</span>
          </BaseButton>
          {secondaryAction}
        </div>
      </Wrapper>
    );
  }

  return (
    <Collapsible.Root
      open={expanded}
      onOpenChange={(next) => {
        setExpandedState(next);
        onExpandedChange?.(next);
      }}
      disabled={disabled}
      render={<Wrapper />}
      className={cx(wrapperStyles, className)}
      {...rest}
    >
      <div className={rowLineStyles}>
        <Collapsible.Trigger className={cx(oracleRowStyles, rowStyles)}>
          <span data-row-name="">{move.name}</span>
          <CaretDown
            data-row-chevron=""
            className={disclosureChevronStyles}
            aria-hidden
          />
        </Collapsible.Trigger>
        {secondaryAction}
      </div>
      <Collapsible.Panel className={collapsiblePanelStyles}>
        <div className={bodyStyles}>
          <MoveCard
            move={move}
            category=""
            hideName
            variant="plain"
            {...moveCardProps}
          />
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
