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

import { ListRow, ListRowButton, listRowStyles } from "ui/components/List";
import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cx } from "styled-system/css";

import { MoveCard, MoveCardProps } from "../MoveCard/MoveCard";
import {
  collapsiblePanelStyles,
  disclosureChevronStyles,
} from "../MoveCard/cardStyles";

const wrapperStyles = css({
  listStyle: "none",
  margin: 0,
  padding: 0,
  minWidth: 0,
  borderRadius: "md",
  transitionProperty: "background-color, box-shadow",
  transitionDuration: "fast",
  transitionTimingFunction: "linear",
  // Open, the row and its move read as one inset card: one frame around
  // both, the move's text starting under the move's name.
  "&[data-expanded]": {
    background: "bg.muted",
    boxShadow: "inset 0 0 0 1px token(colors.border.subtle)",
  },
});

const rowStyles = css({
  "&[aria-expanded=true]": {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
});

const bodyStyles = css({
  paddingInline: "3",
  paddingTop: "1",
  paddingBottom: "3",
});

export interface MoveListItemProps
  extends CssProp,
    Omit<ComponentPropsWithoutRef<"div">, "children"> {
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
  /**
   * A control at the row's end. It lies over the row, which keeps
   * `--row-action-width` (32px) clear for it.
   */
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
  } = withCssProp(props);

  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const expanded = expandedProp ?? expandedState;

  if (render) {
    return (
      <Wrapper className={cx(wrapperStyles, className)} {...rest}>
        <ListRow action={secondaryAction}>
          <ListRowButton render={render} disabled={disabled} current={current}>
            <span data-row-name="">{move.name}</span>
          </ListRowButton>
        </ListRow>
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
      data-expanded={expanded ? "" : undefined}
      {...rest}
    >
      <ListRow action={secondaryAction}>
        <Collapsible.Trigger className={cx(listRowStyles, rowStyles)}>
          <span data-row-name="">{move.name}</span>
          <CaretDown
            data-row-glyph=""
            className={disclosureChevronStyles}
            aria-hidden
          />
        </Collapsible.Trigger>
      </ListRow>
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
