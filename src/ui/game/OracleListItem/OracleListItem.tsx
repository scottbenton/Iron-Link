import { Table } from "@phosphor-icons/react";
import {
  ComponentPropsWithoutRef,
  ElementType,
  ReactElement,
  ReactNode,
} from "react";

import { IconButton } from "ui/components/IconButton";
import { ListRow, ListRowButton } from "ui/components/List";
import { VisuallyHidden } from "ui/components/VisuallyHidden";
import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { DieFace, useDieFace } from "../DieFace";

export interface OracleListItemProps
  extends LayoutProps,
    Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The oracle's name. */
  name: string;
  /** Rolls the oracle. The whole row is the button. */
  onRoll?: () => void;
  /** Read before the name, "Roll" by default ("Roll Action"). */
  actionLabel?: string;
  /** The glyph at the row's end, a die by default; `null` for none. */
  icon?: ReactNode;
  /** Opens the full table, as an icon button beside the row. */
  onViewTable?: () => void;
  /** The view button's name; the oracle's name is added after it. */
  viewTableLabel?: string;
  /** Another control beside the row, in place of the view button. */
  secondaryAction?: ReactNode;
  /**
   * Render the row as a link, such as a reference page:
   * `render={<Link to={href} />}`. It shows no die then.
   */
  render?: ReactElement;
  /** Marks the row as the open page (aria-current). */
  current?: boolean;
  disabled?: boolean;
  /** The wrapper element; `li` inside a list. */
  as?: ElementType;
  className?: string;
}

/**
 * A row in an oracle list, like the oracle drawer: the whole row rolls, its
 * name first and a die at the end, where a move row has its chevron. An
 * optional View table button lies over the row's end.
 */
export function OracleListItem(props: OracleListItemProps) {
  const {
    name,
    onRoll,
    actionLabel = "Roll",
    icon,
    onViewTable,
    viewTableLabel = "View table for",
    secondaryAction,
    render,
    current,
    disabled,
    as: Wrapper = "div",
    className,
    ...rest
  } = withLayoutProps(props);

  const [die, rollDie] = useDieFace();
  const isLink = render !== undefined;
  const glyph = isLink ? null : icon === undefined ? (
    <DieFace {...die} size="inherit" />
  ) : (
    icon
  );
  const action =
    secondaryAction ??
    (onViewTable && (
      <IconButton
        label={`${viewTableLabel} ${name}`}
        size="sm"
        onClick={onViewTable}
        disabled={disabled}
      >
        <Table />
      </IconButton>
    ));

  return (
    <ListRow as={Wrapper} action={action} className={className} {...rest}>
      <ListRowButton
        onClick={
          onRoll &&
          (() => {
            if (!isLink && icon === undefined) rollDie();
            onRoll();
          })
        }
        disabled={disabled}
        render={render}
        current={current}
      >
        <span data-row-name="">
          {!isLink && <VisuallyHidden>{actionLabel} </VisuallyHidden>}
          {name}
        </span>
        {glyph && (
          <span data-row-glyph="" aria-hidden>
            {glyph}
          </span>
        )}
      </ListRowButton>
    </ListRow>
  );
}
