import { Button as BaseButton } from "@base-ui/react/button";
import { DiceFive, Table } from "@phosphor-icons/react";
import {
  ComponentPropsWithoutRef,
  ElementType,
  ReactElement,
  ReactNode,
} from "react";

import { IconButton } from "ui/components/IconButton";
import { VisuallyHidden } from "ui/components/VisuallyHidden";

import { css, cx } from "styled-system/css";

const wrapperStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "0.5",
  minWidth: 0,
  listStyle: "none",
  margin: 0,
  padding: 0,
});

export const oracleRowStyles = css({
  flex: "1",
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  minHeight: "40px",
  paddingInline: "2.5",
  border: 0,
  borderRadius: "md",
  background: "transparent",
  color: "fg.default",
  fontFamily: "body",
  fontSize: "sm",
  fontWeight: "medium",
  lineHeight: "snug",
  textAlign: "left",
  textDecoration: "none",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  transition: "background-color token(durations.fast) linear",
  outline: "none",
  _hover: { background: "overlay.hover" },
  _pressed: { background: "overlay.pressed" },
  _current: {
    background: "overlay.selected",
    fontWeight: "semibold",
    "& [data-row-icon]": { color: "accent.fg" },
  },
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "-2px",
  },
  "&:is(:disabled, [data-disabled])": {
    cursor: "not-allowed",
    color: "fg.disabled",
    background: "transparent",
    "& [data-row-icon], & [data-row-action]": { color: "fg.disabled" },
  },
  "& [data-row-icon]": {
    flex: "none",
    width: "18px",
    height: "18px",
    color: "fg.muted",
  },
  "& [data-row-name]": {
    flex: "1",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  "& [data-row-action]": {
    flex: "none",
    marginInlineStart: "auto",
    color: "fg.muted",
    fontSize: "xs",
  },
  _touch: { minHeight: "touch" },
});

export interface OracleListItemProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The oracle's name. */
  name: string;
  /** Rolls the oracle. The whole row is the button. */
  onRoll?: () => void;
  /** The word at the row's end and before the name for screen readers. */
  actionLabel?: string;
  /** The leading icon, a die by default. */
  icon?: ReactNode;
  /** Opens the full table, as an icon button beside the row. */
  onViewTable?: () => void;
  /** The view button's name; the oracle's name is added after it. */
  viewTableLabel?: string;
  /** Another control beside the row, in place of the view button. */
  secondaryAction?: ReactNode;
  /**
   * Render the row as a link, such as a reference page:
   * `render={<Link to={href} />}`. The action word is hidden then.
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
 * name in the middle and "Roll" at the end. An optional icon button beside
 * it opens the full table.
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
  } = props;

  const isLink = render !== undefined;
  const iconNode = icon ?? <DiceFive weight="bold" />;

  return (
    <Wrapper className={cx(wrapperStyles, className)} {...rest}>
      <BaseButton
        className={oracleRowStyles}
        onClick={onRoll}
        disabled={disabled}
        render={render}
        nativeButton={!isLink}
        aria-current={current ? (isLink ? "page" : "true") : undefined}
      >
        <span data-row-icon="" aria-hidden>
          {iconNode}
        </span>
        <span data-row-name="">
          {!isLink && <VisuallyHidden>{actionLabel} </VisuallyHidden>}
          {name}
        </span>
        {!isLink && (
          <span data-row-action="" aria-hidden>
            {actionLabel}
          </span>
        )}
      </BaseButton>
      {secondaryAction ??
        (onViewTable && (
          <IconButton
            label={`${viewTableLabel} ${name}`}
            size="sm"
            onClick={onViewTable}
            disabled={disabled}
          >
            <Table />
          </IconButton>
        ))}
    </Wrapper>
  );
}
