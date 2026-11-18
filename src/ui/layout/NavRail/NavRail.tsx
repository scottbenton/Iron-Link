import { ReactNode } from "react";

import { css, cx } from "styled-system/css";

import { GradientBox } from "../../game/GradientBox";
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
  // The live rail's width: as narrow as the labels allow.
  width: "80px",
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
  paddingInline: "0.5",
  color: "fg.muted",
  textDecoration: "none",
  outline: "none",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  transition: "color token(durations.fast) linear",
  // The same box current or not, so nothing shifts when the page changes.
  // The current pill is a GradientBox, which draws its own ring inside it.
  "& [data-part=pill]": {
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "60px",
    height: "36px",
    borderRadius: "full",
  },
  "& [data-part=pill]:not([data-gradient])": {
    border: "1px solid transparent",
    transitionProperty: "background-color",
    transitionDuration: "fast",
    transitionTimingFunction: "linear",
  },
  "& [data-part=pill] svg": { width: "22px", height: "22px" },
  // The ring turns, as live; it holds still under reduced motion.
  _reducedMotion: {
    "& [data-part=pill]::before": { animation: "none" },
  },
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
    "& [data-part=pill]:not([data-gradient])": {
      background: "overlay.hover",
    },
  },
  _active: {
    "& [data-part=pill]:not([data-gradient])": {
      background: "overlay.pressed",
    },
  },
  _focusVisible: {
    "& [data-part=pill]": {
      outline: "2px solid token(colors.focusRing)",
      outlineOffset: "2px",
    },
  },
  _current: {
    color: "fg.default",
    "& [data-part=pill]": { color: "accent.fg" },
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
 * The column of destinations on wide screens, 80px wide. Each item is an
 * icon over its label; the current page's icon sits in a pill with the
 * scheme's turning gradient border (a GradientBox, as in the live app), and
 * the link has `aria-current="page"`.
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
                {item.current ? (
                  <GradientBox
                    as="span"
                    data-part="pill"
                    data-gradient=""
                    aria-hidden="true"
                    radius="full"
                    thickness="medium"
                    spin
                  >
                    {item.currentIcon ?? item.icon}
                  </GradientBox>
                ) : (
                  <span data-part="pill" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
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
