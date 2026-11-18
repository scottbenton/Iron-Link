import { css, cx } from "styled-system/css";

import { IconButton } from "../../components/IconButton";
import { LayoutProps, withLayoutProps } from "../../styles/layoutProps";

const barStyles = css({
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  gap: "1",
  flex: "none",
  minHeight: "52px",
  paddingInlineStart: "4",
  paddingInlineEnd: "1",
  borderBottom: "1px solid token(colors.border.default)",
  background: "bg.surface",
});

const titleStyles = css({
  flex: "1 1 auto",
  minWidth: 0,
  margin: 0,
  fontFamily: "body",
  fontSize: "md",
  fontWeight: "semibold",
  lineHeight: "snug",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

/**
 * The count as a phone browser draws its tab switcher: a rounded square
 * outline, never a circle, so it can't read as a notification badge.
 */
const countStyles = css({
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "24px",
  height: "24px",
  flex: "none",
  overflow: "hidden",
  border: "2px solid currentColor",
  borderRadius: "6px",
  color: "fg.default",
  fontFamily: "body",
  fontWeight: "bold",
  lineHeight: "none",
  fontVariantNumeric: "tabular-nums",
  "&[data-digits='1']": { fontSize: "12px" },
  "&[data-digits='2']": { fontSize: "10px" },
  "&[data-digits='3']": { fontSize: "8px", letterSpacing: "-0.04em" },
});

/** The most the square spells out; past it, it reads "99+". */
const MAX_SHOWN = 99;

export interface OpenNotesBarProps extends LayoutProps {
  /** The open note, folder or world page's name. */
  title: string;
  /** How many notes are open. */
  count: number;
  /** Opens the list of open notes (`OpenNotesSheet`). */
  onOpenList: () => void;
  /** Whether the list is open, for `aria-expanded`. */
  listOpen?: boolean;
  /** The count button's name and tooltip, "Open notes, 3". */
  countLabel?: (count: number) => string;
  className?: string;
}

/**
 * The Notes screen's header on phones, standing in for the note tabs: the
 * open item's name and a square with the number of open notes, which lists
 * them in a sheet, like a phone browser's tab button.
 */
export function OpenNotesBar(props: OpenNotesBarProps) {
  const {
    title,
    count,
    onOpenList,
    listOpen = false,
    countLabel = (n: number) => `Open notes, ${n}`,
    className,
  } = withLayoutProps(props);
  const shown = count > MAX_SHOWN ? `${MAX_SHOWN}+` : String(count);
  return (
    <div className={cx(barStyles, className)}>
      <p className={titleStyles}>{title}</p>
      <IconButton
        label={countLabel(count)}
        tooltipSide="bottom"
        aria-haspopup="dialog"
        aria-expanded={listOpen}
        onClick={onOpenList}
      >
        <span
          className={countStyles}
          data-digits={Math.min(shown.length, 3)}
          aria-hidden
        >
          {shown}
        </span>
      </IconButton>
    </div>
  );
}
