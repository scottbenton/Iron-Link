import { useTranslation } from "react-i18next";

import { focusRing } from "ui/styles/focus";

import { css, cx } from "styled-system/css";

import { Badge } from "../../components/Badge";
import { GradientBox } from "../../components/GradientBox";
import { VisuallyHidden } from "../../components/VisuallyHidden";
import { CssProp, withCssProp } from "../../styles/cssProp";
import { LayoutLinkComponent } from "../shared/linkComponentContext";
import { NavItem } from "../shared/navItem";
import { useLinkComponent } from "../shared/useLinkComponent";

const barStyles = css({
  boxSizing: "border-box",
  position: "sticky",
  bottom: 0,
  zIndex: "sticky",
  background: "bg.surface",
  borderTop: "1px solid token(colors.border.default)",
  paddingBottom: "env(safe-area-inset-bottom, 0px)",
  paddingInline:
    "env(safe-area-inset-left, 0px) env(safe-area-inset-right, 0px)",
  fontFamily: "body",
});

const listStyles = css({
  display: "flex",
  margin: 0,
  padding: 0,
  listStyle: "none",
  "& > li": { flex: "1 1 0", minWidth: 0, display: "flex" },
});

const itemStyles = css({
  position: "relative",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "1",
  minHeight: "56px",
  paddingInline: "0.5",
  paddingBlock: "1.5",
  color: "fg.muted",
  textDecoration: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  // As a button (a section of the page rather than a page of its own).
  margin: 0,
  border: 0,
  background: "transparent",
  font: "inherit",
  cursor: "pointer",
  transition: "color token(durations.fast) linear",
  // The rail's items, laid out for the bar: the icon in a pill, the current
  // one in a GradientBox with the scheme's turning ring. The same box
  // current or not, so nothing shifts when the page changes.
  "& [data-part=pill]": {
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "56px",
    height: "32px",
    borderRadius: "full",
  },
  "& [data-part=pill]:not([data-gradient])": {
    border: "1px solid transparent",
    transitionProperty: "background-color",
    transitionDuration: "fast",
    transitionTimingFunction: "linear",
  },
  "& [data-part=pill] svg": { width: "22px", height: "22px", flex: "none" },
  // The ring turns, as on the rail; it holds still under reduced motion.
  _reducedMotion: {
    "& [data-part=pill]::before": { animation: "none" },
  },
  "& [data-part=label]": {
    maxWidth: "100%",
    fontSize: "xs",
    fontWeight: "semibold",
    lineHeight: "snug",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  _hoverable: {
    _hover: {
      color: "fg.default",
      "& [data-part=pill]:not([data-gradient])": {
        background: "overlay.hover",
      },
    },
  },
  _active: {
    "& [data-part=pill]:not([data-gradient])": {
      background: "overlay.pressed",
    },
  },
  _focusVisible: {
    "& [data-part=pill]": focusRing.outset,
  },
  _current: {
    color: "fg.default",
    "& [data-part=pill]": { color: "accent.fg" },
  },
});

/**
 * The count sits lower than Badge's usual corner, so it stays inside the
 * bar instead of crossing its top edge.
 */
const badgeStyles = css({
  "& > [aria-hidden]:last-child": { translate: "35% -10%" },
});

/**
 * A bar item: a link to a page (`href`), or a button that switches a section
 * of the page in place (`onSelect`), as the game page's Sheet, Notes, Moves,
 * Oracles and Log do.
 */
export interface MobileNavItem extends Omit<NavItem, "href"> {
  href?: string;
  /** Chooses the item without navigating. Used when there is no `href`. */
  onSelect?: () => void;
  /**
   * A count on the icon's corner, such as unread log entries. Hidden at
   * zero; read after the label through `badgeLabel`.
   */
  badge?: number;
}

export interface MobileNavProps extends CssProp {
  /** The main destinations or sections; four or five fit. */
  items: MobileNavItem[];
  /** The navigation landmark's name. */
  label?: string;
  /** Renders the links; defaults to the LinkComponentProvider's, or `<a>`. */
  linkComponent?: LayoutLinkComponent;
  /** Read after an item's label when it has a badge, "3 unread". */
  badgeLabel?: (count: number) => string;
  className?: string;
}

/**
 * The bottom tab bar on phones: one item per destination, each the full
 * height of the bar (past the 44px touch target). Items are the rail's: an
 * icon in a pill over its label, the current one's pill in the scheme's
 * turning gradient ring (a GradientBox), with `aria-current="page"`. Unlike
 * the rail it follows the page's mode. Items are
 * links, or buttons that switch the page's section (the game page's Sheet,
 * Notes, Moves, Oracles and Log), and can carry a count badge.
 *
 * Leave it out while the on-screen keyboard is up, so it never sits between
 * the keyboard and the text being typed.
 */
export function MobileNav(props: MobileNavProps) {
  const { t } = useTranslation();
  const {
    items,
    label = t("ui.nav.main", "Main"),
    linkComponent,
    badgeLabel = (count: number) =>
      t("ui.mobile-nav.unread", "{{count}} unread", { count }),
    className,
  } = withCssProp(props);
  const Link = useLinkComponent(linkComponent);

  return (
    <nav aria-label={label} className={cx(barStyles, className)}>
      <ul className={listStyles}>
        {items.map((item) => {
          const badge = item.badge ?? 0;
          const icon = item.current
            ? (item.currentIcon ?? item.icon)
            : item.icon;
          const pill = item.current ? (
            <GradientBox
              as="span"
              data-part="pill"
              data-gradient=""
              radius="full"
              spin
            >
              {icon}
            </GradientBox>
          ) : (
            <span data-part="pill">{icon}</span>
          );
          const content = (
            <>
              <span aria-hidden="true" className={css({ display: "flex" })}>
                {badge > 0 ? (
                  <Badge count={badge} className={badgeStyles}>
                    {pill}
                  </Badge>
                ) : (
                  pill
                )}
              </span>
              <span data-part="label">{item.label}</span>
              {badge > 0 && (
                <VisuallyHidden>, {badgeLabel(badge)}</VisuallyHidden>
              )}
            </>
          );
          return (
            <li key={item.id}>
              {item.href !== undefined ? (
                <Link
                  href={item.href}
                  className={itemStyles}
                  aria-current={item.current ? "page" : undefined}
                  onClick={item.onSelect}
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  className={itemStyles}
                  aria-current={item.current ? "page" : undefined}
                  onClick={item.onSelect}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
