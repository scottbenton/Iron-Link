import { css, cx } from "styled-system/css";

import { LayoutLinkComponent, useLinkComponent } from "../shared/linkContext";
import { NavItem } from "../shared/navItem";

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
  gap: "0.5",
  minHeight: "56px",
  paddingInline: "1",
  paddingBlock: "1.5",
  color: "fg.muted",
  textDecoration: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  transition:
    "color token(durations.fast) linear, background-color token(durations.fast) linear",
  // The gradient bar on the bar's top edge, grown from the middle.
  _before: {
    content: '""',
    position: "absolute",
    top: 0,
    insetInline: "25%",
    height: "3px",
    borderBottomRadius: "3px",
    background: "token(gradients.ring)",
    scale: "0 1",
    transition: "scale token(durations.normal) token(easings.out)",
    _reducedMotion: { transition: "none" },
  },
  "& svg": { width: "24px", height: "24px", flex: "none" },
  "& [data-part=label]": {
    maxWidth: "100%",
    fontSize: "xs",
    fontWeight: "semibold",
    lineHeight: "snug",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  _hoverable: { _hover: { color: "fg.default" } },
  _active: { background: "overlay.pressed" },
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "-4px",
    borderRadius: "md",
  },
  _current: {
    color: "fg.default",
    _before: { scale: "1 1" },
    "& svg": { color: "accent.fg" },
  },
});

export interface MobileNavProps {
  /** The main destinations; four or five fit. */
  items: NavItem[];
  /** The navigation landmark's name. */
  label?: string;
  /** Renders the links; defaults to the LinkComponentProvider's, or `<a>`. */
  linkComponent?: LayoutLinkComponent;
  className?: string;
}

/**
 * The bottom tab bar on phones: one link per destination, each the full
 * height of the bar (56px, past the 44px touch target). The current page
 * has the gradient bar on its top edge and `aria-current="page"`.
 */
export function MobileNav(props: MobileNavProps) {
  const { items, label = "Main", linkComponent, className } = props;
  const Link = useLinkComponent(linkComponent);

  return (
    <nav aria-label={label} className={cx(barStyles, className)}>
      <ul className={listStyles}>
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={itemStyles}
              aria-current={item.current ? "page" : undefined}
            >
              <span aria-hidden="true" className={css({ display: "flex" })}>
                {item.current ? (item.currentIcon ?? item.icon) : item.icon}
              </span>
              <span data-part="label">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
