import { ReactNode } from "react";

import { css, cx } from "styled-system/css";

import { Logo } from "../Logo";
import { LayoutLinkComponent, useLinkComponent } from "../shared/linkContext";
import { NavItem } from "../shared/navItem";

const railStyles = css({
  boxSizing: "border-box",
  position: "sticky",
  top: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "6",
  width: "88px",
  height: "var(--app-shell-height, 100dvh)",
  paddingBlock: "4",
  overflowY: "auto",
  scrollbarWidth: "none",
  background: "bg.canvas",
  borderInlineEnd: "1px solid token(colors.border.default)",
  color: "fg.default",
  fontFamily: "body",
});

const homeStyles = css({
  display: "flex",
  justifyContent: "center",
  alignSelf: "center",
  padding: "1",
  borderRadius: "lg",
  color: "inherit",
  outline: "none",
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "2px",
  },
});

const listStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
  margin: 0,
  padding: 0,
  listStyle: "none",
});

const itemStyles = css({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1",
  paddingBlock: "1",
  paddingInline: "1",
  color: "fg.muted",
  textDecoration: "none",
  outline: "none",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  transition: "color token(durations.fast) linear",
  // The gradient bar on the rail's edge, grown from the middle when current.
  _before: {
    content: '""',
    position: "absolute",
    insetInlineStart: 0,
    top: "1",
    width: "3px",
    height: "32px",
    borderStartEndRadius: "3px",
    borderEndEndRadius: "3px",
    background: "token(gradients.ring)",
    scale: "1 0",
    transition: "scale token(durations.normal) token(easings.out)",
    _reducedMotion: { transition: "none" },
  },
  "& [data-part=pill]": {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "56px",
    height: "32px",
    borderRadius: "full",
    border: "1px solid transparent",
    transitionProperty: "background-color, border-color, box-shadow",
    transitionDuration: "fast",
    transitionTimingFunction: "linear",
  },
  "& [data-part=pill] svg": { width: "22px", height: "22px" },
  "& [data-part=label]": {
    maxWidth: "100%",
    fontSize: "xs",
    fontWeight: "semibold",
    lineHeight: "snug",
    textAlign: "center",
    overflowWrap: "anywhere",
    lineClamp: 2,
  },
  _hover: {
    color: "fg.default",
    "& [data-part=pill]": { background: "overlay.hover" },
  },
  _active: {
    "& [data-part=pill]": { background: "overlay.pressed" },
  },
  _focusVisible: {
    "& [data-part=pill]": {
      outline: "2px solid token(colors.focusRing)",
      outlineOffset: "2px",
    },
  },
  _current: {
    color: "fg.default",
    _before: { scale: "1 1" },
    "& [data-part=pill]": {
      background: "bg.surface",
      borderColor: "border.default",
      boxShadow: "ledge",
      color: "accent.fg",
    },
  },
});

const actionsStyles = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1",
  marginBlockStart: "auto",
});

export interface NavRailProps {
  /** The main destinations: Games, Worlds, Homebrew, Reference. */
  items: NavItem[];
  /** Where the logo links to. Leave out to show the logo without a link. */
  homeHref?: string;
  /** The logo link's name. */
  homeLabel?: string;
  /** The navigation landmark's name. */
  label?: string;
  /** Pinned to the foot of the rail: settings, the account menu. */
  actions?: ReactNode;
  /** Renders the links; defaults to the LinkComponentProvider's, or `<a>`. */
  linkComponent?: LayoutLinkComponent;
  className?: string;
}

/**
 * The column of destinations on wide screens. Each item is an icon over its
 * label; the current page is a raised pill with the gradient bar on the
 * rail's edge, and `aria-current="page"`.
 */
export function NavRail(props: NavRailProps) {
  const {
    items,
    homeHref,
    homeLabel = "Iron Link",
    label = "Main",
    actions,
    linkComponent,
    className,
  } = props;
  const Link = useLinkComponent(linkComponent);

  return (
    <div className={cx(railStyles, className)}>
      {homeHref ? (
        <Link href={homeHref} className={homeStyles}>
          <Logo size={40} label={homeLabel} />
        </Link>
      ) : (
        <span className={homeStyles}>
          <Logo size={40} />
        </span>
      )}
      <nav aria-label={label}>
        <ul className={listStyles}>
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={itemStyles}
                aria-current={item.current ? "page" : undefined}
              >
                <span data-part="pill" aria-hidden="true">
                  {item.current ? (item.currentIcon ?? item.icon) : item.icon}
                </span>
                <span data-part="label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {actions && <div className={actionsStyles}>{actions}</div>}
    </div>
  );
}
