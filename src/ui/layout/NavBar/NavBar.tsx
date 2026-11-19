import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { CaretLeftIcon, ListIcon, XIcon } from "@phosphor-icons/react";
import { ReactNode, useRef, useState } from "react";

import { focusRing } from "ui/styles/focus";
import { ledgeLayers } from "ui/styles/ledge";
import { ledgeShadow } from "ui/styles/ledge";
import { quietPressable } from "ui/styles/pressable";

import { css, cx } from "styled-system/css";

import { IconButton } from "../../components/IconButton";
import { LayoutProps, withLayoutProps } from "../../styles/layoutProps";
import { Logo } from "../Logo";
import { LayoutLinkComponent, useLinkComponent } from "../shared/linkContext";
import { NavItem } from "../shared/navItem";
import { phoneOnly } from "../shared/shell";

const barStyles = css({
  boxSizing: "border-box",
  position: "sticky",
  top: 0,
  zIndex: "sticky",
  flex: "none",
  background: "bg.surface",
  borderBottom: "1px solid token(colors.border.default)",
  boxShadow: ledgeShadow("token(colors.border.subtle)"),
  color: "fg.default",
  fontFamily: "body",
  paddingTop: "env(safe-area-inset-top, 0px)",
  // On wide screens the bar is gone (the rail has the logo and the links),
  // and only its heading stays, for screen readers.
  "@container shell (min-width: 900px)": {
    position: "static",
    padding: 0,
    paddingTop: 0,
    border: 0,
    borderBottom: "none",
    boxShadow: "none",
    background: "transparent",
    "& [data-part=row]": { minHeight: 0, padding: 0 },
  },
});

const rowStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
  minHeight: "56px",
  paddingInline: "2",
  "@container shell (min-width: 900px)": {
    minHeight: "64px",
    gap: "3",
    paddingInline: "4",
  },
});

const titleStyles = css({
  flex: "1 1 auto",
  minWidth: 0,
  margin: 0,
  paddingInline: "1",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "lg",
  lineHeight: "tight",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

/** Visually hidden on wide screens, where the page shows its own title. */
const srOnlyOnWideStyles = css({
  "@container shell (min-width: 900px)": {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
  },
});

const homeLinkStyles = css({
  display: "inline-flex",
  alignItems: "center",
  flex: "none",
  minHeight: "control.md",
  paddingInline: "1",
  borderRadius: "md",
  color: "inherit",
  textDecoration: "none",
  outline: "none",
  _focusVisible: focusRing.outset,
});

const spacerStyles = css({ flex: "1 1 auto" });

const iconSlotStyles = css({ display: "flex" });

const logoSlotStyles = css({ display: "flex", flex: "none" });

const actionsStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
  flex: "none",
});

const secondaryRowStyles = css({
  display: "flex",
  alignItems: "flex-end",
  minWidth: 0,
});

const backdropStyles = css({
  position: "fixed",
  inset: 0,
  zIndex: "drawer",
  background: "backdrop",
  transition: "opacity token(durations.normal) linear",
  _startingStyle: { opacity: 0 },
  _endingStyle: { opacity: 0, transitionDuration: "fast" },
});

const drawerStyles = css({
  boxSizing: "border-box",
  position: "fixed",
  zIndex: "drawer",
  top: 0,
  bottom: 0,
  insetInlineStart: 0,
  display: "flex",
  flexDirection: "column",
  width: "min(320px, calc(100vw - 48px))",
  paddingTop: "env(safe-area-inset-top, 0px)",
  paddingBottom: "env(safe-area-inset-bottom, 0px)",
  background: "bg.surface",
  borderInlineEnd: "1px solid token(colors.border.control)",
  borderStartEndRadius: "xl",
  borderEndEndRadius: "xl",
  boxShadow: "float",
  color: "fg.default",
  outline: "none",
  transition: "translate token(durations.normal) token(easings.out)",
  _startingStyle: { translate: "-100% 0" },
  _endingStyle: {
    translate: "-100% 0",
    transitionDuration: "fast",
    transitionTimingFunction: "in",
  },
  _reducedMotion: {
    transitionProperty: "opacity",
    _startingStyle: { translate: "0 0", opacity: 0 },
    _endingStyle: { translate: "0 0", opacity: 0 },
  },
  "[dir=rtl] &": {
    _startingStyle: { translate: "100% 0" },
    _endingStyle: { translate: "100% 0" },
  },
});

const drawerHeaderStyles = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "2",
  minHeight: "56px",
  paddingInlineStart: "4",
  paddingInlineEnd: "2",
  borderBottom: "1px solid token(colors.border.subtle)",
});

const drawerListStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "0.5",
  margin: 0,
  padding: "2",
  listStyle: "none",
  overflowY: "auto",
});

const drawerLinkStyles = css({
  ...quietPressable,
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: "3",
  minHeight: "touch",
  paddingInline: "3",
  border: "1px solid transparent",
  borderRadius: "md",
  color: "fg.muted",
  fontSize: "sm",
  fontWeight: "semibold",
  transitionProperty: "background-color, color",
  "& svg": { width: "icon.md", height: "icon.md", flex: "none" },
  _hoverable: {
    _hover: { background: "overlay.hover", color: "fg.default" },
  },
  _focusVisible: focusRing.inset,
  _current: {
    ...ledgeLayers(),
    "--ledge-face": "{colors.bg.surface}",
    "--ledge-border": "{colors.border.default}",
    "--ledge-edge": "{colors.border.edge}",
    color: "fg.default",
    "& svg": { color: "accent.fg" },
  },
});

const drawerFooterStyles = css({
  marginBlockStart: "auto",
  padding: "3",
  borderTop: "1px solid token(colors.border.subtle)",
});

export interface NavBarProps extends LayoutProps {
  /**
   * The page's title, rendered as its one h1. Visible on phones; on wide
   * screens it stays for screen readers only (CLAUDE.md), since the page
   * shows its own title. Without one, phones show the logo.
   */
  title?: ReactNode;
  /** An id for the h1, so a page can point aria-labelledby at it. */
  titleId?: string;
  /** Where the logo links to. */
  homeHref?: string;
  /** The logo link's name, and the wordmark's text. */
  homeLabel?: string;
  /**
   * The main destinations. On phones they open from a menu button in a
   * drawer. Leave out when the page has a MobileNav bottom bar instead.
   */
  items?: NavItem[];
  /** Shows a back button on phones, linking here (a game's character to the game). */
  backHref?: string;
  backLabel?: string;
  /** Buttons at the end of the bar: settings, the account menu. */
  actions?: ReactNode;
  /** A second row under the bar, such as section tabs on phones. */
  secondaryRow?: ReactNode;
  /** The navigation landmark's name. */
  navLabel?: string;
  menuLabel?: string;
  closeMenuLabel?: string;
  /** Shown at the foot of the phone menu, such as the signed in account. */
  menuFooter?: ReactNode;
  /** Renders the links; defaults to the LinkComponentProvider's, or `<a>`. */
  linkComponent?: LayoutLinkComponent;
  className?: string;
}

/**
 * The top app bar. On phones it holds the menu or back button, the page
 * title (the page's h1) and actions, with an optional second row of tabs.
 * On wide screens, beside a NavRail, it is hidden but for its h1, which
 * stays for screen readers.
 *
 * Put it inside `<main>` (AppShell's `topBar` does), so route focus finds
 * its h1 there.
 */
export function NavBar(props: NavBarProps) {
  const {
    title,
    titleId,
    homeHref,
    homeLabel = "Iron Link",
    items,
    backHref,
    backLabel = "Go Back",
    actions,
    secondaryRow,
    navLabel = "Main",
    menuLabel = "Open Navigation Menu",
    closeMenuLabel = "Close Navigation Menu",
    menuFooter,
    linkComponent,
    className,
  } = withLayoutProps(props);

  const Link = useLinkComponent(linkComponent);
  const [menuOpen, setMenuOpen] = useState(false);
  // A link chosen in the menu navigates; focus then belongs to the new page,
  // not back on the menu button.
  const navigatedRef = useRef(false);

  const hasMenu = !!items && items.length > 0;

  const logoContent = (
    <Logo size={32} wordmark label={homeLabel} wordmarkLabel={homeLabel} />
  );
  const logo = homeHref ? (
    <Link href={homeHref} className={homeLinkStyles}>
      {logoContent}
    </Link>
  ) : (
    <span className={homeLinkStyles}>{logoContent}</span>
  );

  return (
    <header className={cx(barStyles, className)}>
      <div className={rowStyles} data-part="row">
        {hasMenu && (
          <span className={phoneOnly}>
            <BaseDialog.Root
              open={menuOpen}
              onOpenChange={(open) => {
                if (open) navigatedRef.current = false;
                setMenuOpen(open);
              }}
            >
              <BaseDialog.Trigger
                render={
                  <IconButton label={menuLabel} tooltipSide="bottom">
                    <ListIcon />
                  </IconButton>
                }
              />
              <BaseDialog.Portal>
                <BaseDialog.Backdrop className={backdropStyles} />
                <BaseDialog.Popup
                  className={cx("ui-root", drawerStyles)}
                  aria-label={navLabel}
                  finalFocus={() => !navigatedRef.current}
                >
                  <div className={drawerHeaderStyles}>
                    <Logo size={28} wordmark wordmarkLabel={homeLabel} />
                    <BaseDialog.Close
                      render={
                        <IconButton label={closeMenuLabel} tooltipSide="bottom">
                          <XIcon />
                        </IconButton>
                      }
                    />
                  </div>
                  <nav aria-label={navLabel}>
                    <ul className={drawerListStyles}>
                      {items.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            className={drawerLinkStyles}
                            aria-current={item.current ? "page" : undefined}
                            onClick={() => {
                              navigatedRef.current = true;
                              setMenuOpen(false);
                            }}
                          >
                            <span aria-hidden="true" className={iconSlotStyles}>
                              {item.current
                                ? (item.currentIcon ?? item.icon)
                                : item.icon}
                            </span>
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  {menuFooter && (
                    <div className={drawerFooterStyles}>{menuFooter}</div>
                  )}
                </BaseDialog.Popup>
              </BaseDialog.Portal>
            </BaseDialog.Root>
          </span>
        )}
        {backHref && (
          <span className={phoneOnly}>
            <IconButton
              label={backLabel}
              tooltipSide="bottom"
              render={<Link href={backHref} />}
              nativeButton={false}
            >
              <CaretLeftIcon />
            </IconButton>
          </span>
        )}
        {/* Phones show the logo when there is no title. */}
        {!title && (
          <span className={cx(logoSlotStyles, phoneOnly)}>{logo}</span>
        )}
        {title && (
          <h1 id={titleId} className={cx(titleStyles, srOnlyOnWideStyles)}>
            {title}
          </h1>
        )}
        {!title && <span className={cx(spacerStyles, phoneOnly)} />}
        {actions && (
          <div className={cx(actionsStyles, phoneOnly)}>{actions}</div>
        )}
      </div>
      {secondaryRow && (
        <div className={cx(secondaryRowStyles, phoneOnly)}>{secondaryRow}</div>
      )}
    </header>
  );
}
