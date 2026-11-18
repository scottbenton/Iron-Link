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

/**
 * The banner runs edge to edge under the bar: no radius and no side or top
 * border, so it reads as part of the page rather than a card on it. The
 * attribute raises these over the Alert's own recipe.
 */
const bannerStyles = css({
  flex: "none",
  "&[data-part=banner] > *": {
    width: "100%",
    maxWidth: "none",
    marginInline: 0,
    borderRadius: 0,
    borderInlineWidth: 0,
    borderTopWidth: 0,
  },
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

/**
 * Both sidebars in one column, the character sheet over the reference, as
 * the live app lays out between 900 and 1200px. The column is the start
 * sidebar's width: the end sidebar is size contained so it adds none, then
 * stretched to fill. The two share the height.
 */
const stackStyles = css({
  display: "flex",
  flexDirection: "column",
  flex: "none",
  minHeight: 0,
  "& > [data-side]": { flex: "1 1 0", minHeight: 0 },
  "& > [data-side=end]": {
    width: "auto",
    contain: "inline-size",
    borderInlineStart: 0,
    borderInlineEnd: "1px solid token(colors.border.default)",
    borderTop: "1px solid token(colors.border.default)",
  },
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
  fontWeight: "bold",
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
  /**
   * A notice above the tabs, such as the Worlds beta banner (an `Alert`).
   * It runs edge to edge, with its radius and side borders removed.
   */
  banner?: ReactNode;
  /** The main column, such as the notes. Its title is the column's h2. */
  main: LayoutPanel & {
    /**
     * Keep the h2 for screen readers only, for content with its own header
     * (the notes' toolbar). The column's `actions` then go in that header.
     */
    hideTitle?: boolean;
  };
  /** The column before the main one: the character sheet (or the game's overview). */
  startSidebar?: GameSidebar;
  /** The column after the main one: the reference (moves, oracles, game log). */
  endSidebar?: GameSidebar;
  /**
   * Stack the end sidebar under the start one, in a single column beside
   * the main column, as the live app does between 900 and 1200px. Pass
   * `!useIsBreakpoint("greater-than", "lg")`. While stacked, the column
   * keeps the start sidebar's resize handle; neither sidebar collapses, and
   * the end one has no handle of its own.
   */
  stackSidebars?: boolean;
  /**
   * The phone layout: every sidebar panel and the main column become full
   * screen sections behind one row of tabs, in the live app's order (the
   * start sidebar's, then the main column, then the end sidebar's), opening
   * on the first. Pass the app's `useIsMobile()`;
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
 * The game page, laid out as the live app's: the game's page tabs over
 * three columns, the character sheet, the notes and the reference. Each
 * column has its own h2 and scrolls on its own, so the page fills the
 * screen (give AppShell `fill`). The reader can resize and collapse the
 * sidebars; between 900 and 1200px the sheet and the reference stack in one
 * column (`stackSidebars`), and on phones every column is a full screen
 * section behind tabs (`compact`).
 */
export function GameLayout(props: GameLayoutProps) {
  const {
    tabs,
    banner,
    main,
    startSidebar,
    endSidebar,
    stackSidebars = false,
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
    ...(startSidebar?.panels ?? []),
    main,
    ...(endSidebar?.panels ?? []),
  ];
  const [activeSection, setActiveSection] = useControllableState(
    compactPanelId,
    sections[0].id,
    onCompactPanelChange,
  );
  const bannerSlot = banner && (
    <div className={bannerStyles} data-part="banner">
      {banner}
    </div>
  );

  if (compact) {
    const current =
      sections.find((section) => section.id === activeSection) ?? sections[0];
    return (
      <div className={cx(rootStyles, className)}>
        {bannerSlot}
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

  const stacked = stackSidebars && !!startSidebar && !!endSidebar;
  const sidebarCount = stacked
    ? 1
    : (startSidebar ? 1 : 0) + (endSidebar ? 1 : 0);

  const mainColumn = (
    <div className={mainStyles}>
      {main.hideTitle ? (
        <h2 id={mainHeadingId} tabIndex={-1} className={srOnlyStyles}>
          {main.title}
        </h2>
      ) : (
        <div className={mainHeaderStyles}>
          <h2 id={mainHeadingId} tabIndex={-1} className={columnTitleStyles}>
            {main.title}
          </h2>
          {main.actions && <div className={actionsStyles}>{main.actions}</div>}
        </div>
      )}
      <div className={scrollStyles}>{main.content}</div>
    </div>
  );

  return (
    <div className={cx(rootStyles, className)}>
      {bannerSlot}
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
        {stacked ? (
          // Reading order follows the eye: the column top to bottom, then
          // the main column.
          <>
            <div className={stackStyles}>
              <Sidebar
                side="start"
                {...startSidebar}
                collapsed={false}
                collapsible={false}
              />
              <Sidebar
                side="end"
                {...endSidebar}
                collapsed={false}
                collapsible={false}
                resizable={false}
              />
            </div>
            {mainColumn}
          </>
        ) : (
          <>
            {startSidebar && <Sidebar side="start" {...startSidebar} />}
            {mainColumn}
            {endSidebar && <Sidebar side="end" {...endSidebar} />}
          </>
        )}
      </div>
    </div>
  );
}
