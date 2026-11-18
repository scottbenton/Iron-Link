import { Tabs } from "@base-ui/react/tabs";
import { CSSProperties, ReactNode, useId } from "react";

import { css, cx } from "styled-system/css";

import { Sidebar, SidebarProps } from "../Sidebar";
import { LayoutPanel } from "../shared/layoutPanel";
import {
  sectionTabListStyles,
  sectionTabStyles,
  srOnlyStyles,
} from "../shared/sectionTabs";
import { useControllableState } from "../shared/useControllableState";

const rootStyles = css({
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  height: "100%",
  minHeight: 0,
  minWidth: 0,
  background: "bg.surface",
  color: "fg.default",
  fontFamily: "body",
});

const tabsRowStyles = css({
  flex: "none",
  minWidth: 0,
  paddingInline: "2",
  background: "bg.surface",
  borderBottom: "1px solid token(colors.border.default)",
});

const bodyStyles = css({
  // Sidebars cap their width at the room left beside the main column.
  containerType: "inline-size",
  display: "flex",
  flex: "1 1 auto",
  minHeight: 0,
  "--sidebar-cap":
    "calc((100cqi - var(--game-main-min-width, 360px)) / var(--game-sidebar-count, 1))",
});

const mainStyles = css({
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  minWidth: 0,
  minHeight: 0,
});

const mainHeaderStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  flex: "none",
  minHeight: "52px",
  paddingBlock: "2",
  paddingInline: "4",
  borderBottom: "1px solid token(colors.border.subtle)",
});

const columnTitleStyles = css({
  flex: "1 1 auto",
  minWidth: 0,
  margin: 0,
  fontFamily: "heading",
  fontWeight: "semibold",
  fontSize: "lg",
  lineHeight: "tight",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  outline: "none",
});

const actionsStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "0.5",
  flex: "none",
  marginInlineStart: "auto",
});

const scrollStyles = css({
  position: "relative",
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
  outline: "none",
  "&[hidden]": { display: "none" },
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "-2px",
  },
});

const compactRootStyles = css({
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  minHeight: 0,
});

const compactTabsStyles = css({
  flex: "none",
  paddingBlock: "2",
  paddingInline: "2",
  background: "bg.surface",
  borderBottom: "1px solid token(colors.border.default)",
  "& [role=tablist]": { width: "100%" },
});

const compactActionsStyles = css({
  display: "flex",
  justifyContent: "flex-end",
  gap: "1",
  paddingBlock: "1",
  paddingInline: "2",
});

/** A side column's settings: GameLayout passes the rest. */
export type GameSidebar = Omit<SidebarProps, "side">;

export interface GameLayoutProps {
  /**
   * The game's page tabs (Overview, each character, Add Character), the
   * one level of tabs that wears the gradient.
   */
  tabs?: ReactNode;
  /** A notice above the tabs, such as the Worlds beta banner. */
  banner?: ReactNode;
  /** The main column, such as the notes. Its title is the column's h2. */
  main: LayoutPanel & {
    /**
     * Keep the h2 for screen readers only, for content with its own header
     * (the notes' toolbar). The column's `actions` then go in that header.
     */
    hideTitle?: boolean;
  };
  /** A sidebar before the main column: the character sheet, or the sheet and the reference behind tabs. */
  startSidebar?: GameSidebar;
  /** A sidebar after the main column, such as the reference on very wide screens. */
  endSidebar?: GameSidebar;
  /**
   * The phone layout: the main column and every sidebar panel become full
   * screen sections behind one row of tabs. Pass the app's `useIsMobile()`;
   * the roles change with it (tabs and tab panels on phones, columns with
   * headings on wide screens), so CSS alone cannot make this switch.
   */
  compact?: boolean;
  /** The section showing on phones. Uncontrolled without it. */
  compactPanelId?: string;
  onCompactPanelChange?: (panelId: string) => void;
  /** The phone tab list's name. */
  compactTabsLabel?: string;
  /** The narrowest the main column gets before sidebars stop growing. */
  mainMinWidth?: number;
  className?: string;
}

/**
 * The game page: page tabs over the main column and its sidebars. Each
 * column has its own h2 and scrolls on its own, so the page fills the
 * screen (give AppShell `fill`). The reader can resize and collapse the
 * sidebars; on phones every column is a full screen section behind tabs.
 */
export function GameLayout(props: GameLayoutProps) {
  const {
    tabs,
    banner,
    main,
    startSidebar,
    endSidebar,
    compact = false,
    compactPanelId,
    onCompactPanelChange,
    compactTabsLabel = "Game Sections",
    mainMinWidth = 360,
    className,
  } = props;

  const idPrefix = `game${useId().replace(/:/g, "")}`;
  const mainHeadingId = main.headingId ?? `${idPrefix}-main-heading`;

  const sections: LayoutPanel[] = [
    main,
    ...(startSidebar?.panels ?? []),
    ...(endSidebar?.panels ?? []),
  ];
  const [activeSection, setActiveSection] = useControllableState(
    compactPanelId,
    main.id,
    onCompactPanelChange,
  );

  if (compact) {
    const current =
      sections.find((section) => section.id === activeSection) ?? main;
    return (
      <div className={cx(rootStyles, className)}>
        {banner}
        {tabs && <div className={tabsRowStyles}>{tabs}</div>}
        <Tabs.Root
          value={current.id}
          onValueChange={(value) => setActiveSection(String(value))}
          className={compactRootStyles}
        >
          <div className={compactTabsStyles}>
            <Tabs.List
              aria-label={compactTabsLabel}
              className={sectionTabListStyles}
              activateOnFocus
            >
              {sections.map((section) => (
                <Tabs.Tab
                  key={section.id}
                  value={section.id}
                  className={sectionTabStyles}
                >
                  {section.title}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </div>
          {sections.map((section) => (
            <Tabs.Panel
              key={section.id}
              value={section.id}
              keepMounted
              className={scrollStyles}
            >
              {/* The tab names the section; the h2 keeps heading navigation. */}
              <h2
                id={
                  section === main
                    ? mainHeadingId
                    : (section.headingId ?? `${idPrefix}-${section.id}-heading`)
                }
                tabIndex={-1}
                className={srOnlyStyles}
              >
                {section.title}
              </h2>
              {section.actions && (
                <div className={compactActionsStyles}>{section.actions}</div>
              )}
              {section.content}
            </Tabs.Panel>
          ))}
        </Tabs.Root>
      </div>
    );
  }

  const sidebarCount = (startSidebar ? 1 : 0) + (endSidebar ? 1 : 0);

  return (
    <div className={cx(rootStyles, className)}>
      {banner}
      {tabs && <div className={tabsRowStyles}>{tabs}</div>}
      <div
        className={bodyStyles}
        style={
          {
            "--game-main-min-width": `${mainMinWidth}px`,
            "--game-sidebar-count": Math.max(1, sidebarCount),
          } as CSSProperties
        }
      >
        {startSidebar && <Sidebar side="start" {...startSidebar} />}
        <div className={mainStyles}>
          {main.hideTitle ? (
            <h2 id={mainHeadingId} tabIndex={-1} className={srOnlyStyles}>
              {main.title}
            </h2>
          ) : (
            <div className={mainHeaderStyles}>
              <h2
                id={mainHeadingId}
                tabIndex={-1}
                className={columnTitleStyles}
              >
                {main.title}
              </h2>
              {main.actions && (
                <div className={actionsStyles}>{main.actions}</div>
              )}
            </div>
          )}
          <div className={scrollStyles}>{main.content}</div>
        </div>
        {endSidebar && <Sidebar side="end" {...endSidebar} />}
      </div>
    </div>
  );
}
