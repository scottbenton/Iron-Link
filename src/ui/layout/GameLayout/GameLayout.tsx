import { ArrowLineRightIcon } from "@phosphor-icons/react";
import { CSSProperties, ReactNode, useEffect, useId, useRef } from "react";

import { focusRing } from "ui/styles/focus";

import { css, cx } from "styled-system/css";

import { IconButton } from "../../components/IconButton";
import { Sidebar, SidebarProps } from "../Sidebar";
import { LayoutPanel } from "../shared/layoutPanel";
import { srOnlyStyles } from "../shared/sectionTabs";
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

// PageTabs draws its own hairline under the tabs, edge to edge, so the row
// adds none (the two together were a doubled line).
const tabsRowStyles = css({
  flex: "none",
  minWidth: 0,
  background: "bg.surface",
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
  _focusVisible: focusRing.inset,
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
   * `!useIsBreakpoint("greater-than", "lg")`. The column keeps the start
   * sidebar's width and resize handle. It stacks only while both sidebars
   * are open: each keeps its own Collapse (the end one's sits in its first
   * panel's header), and collapsing either one leaves the other open as its
   * own column, beside a rail for the collapsed one. So the reader can keep
   * the sheet open with the reference on a rail, or the other way round.
   */
  stackSidebars?: boolean;
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
 * column while both are open (`stackSidebars`). Phones use a layout of
 * their own (the phone game page), not this one.
 */
export function GameLayout(props: GameLayoutProps) {
  const {
    tabs,
    banner,
    main,
    startSidebar,
    endSidebar,
    stackSidebars = false,
    mainMinWidth = 360,
    className,
  } = props;

  const idPrefix = `game${useId().replace(/:/g, "")}`;
  const mainHeadingId = main.headingId ?? `${idPrefix}-main-heading`;
  const endId = endSidebar?.id ?? `${idPrefix}-end`;

  // Each sidebar's collapsed state, here so that stacking can follow it.
  const [startCollapsed, setStartCollapsed] = useControllableState(
    startSidebar?.collapsed,
    false,
    startSidebar?.onCollapsedChange,
  );
  const [endCollapsed, setEndCollapsed] = useControllableState(
    endSidebar?.collapsed,
    false,
    endSidebar?.onCollapsedChange,
  );

  const canStack = stackSidebars && !!startSidebar && !!endSidebar;
  const stacked = canStack && !startCollapsed && !endCollapsed;

  // Stacking or unstacking swaps the end sidebar between its own column and
  // the stacked one, so the control the reader used goes. Focus moves to its
  // counterpart: the rail's Expand, or the stacked column's Collapse.
  const endCollapseRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"endExpand" | "endCollapse" | null>(null);
  useEffect(() => {
    const pending = pendingFocus.current;
    pendingFocus.current = null;
    if (pending === "endCollapse") endCollapseRef.current?.focus();
    else if (pending === "endExpand")
      document
        .getElementById(endId)
        ?.querySelector<HTMLElement>("button")
        ?.focus();
  }, [endCollapsed, endId]);

  const changeEndCollapsed = (collapsed: boolean) => {
    if (canStack && !startCollapsed) {
      pendingFocus.current = collapsed ? "endExpand" : "endCollapse";
    }
    setEndCollapsed(collapsed);
  };

  const bannerSlot = banner && (
    <div className={bannerStyles} data-part="banner">
      {banner}
    </div>
  );

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

  // Stacked, the end sidebar's Collapse sits in its first panel's header,
  // and each Collapse names its sidebar, since the column holds two.
  const nameOf = (sidebar: GameSidebar) =>
    sidebar.labels?.collapse ?? `Collapse ${sidebar.panels[0]?.title ?? ""}`;
  const stackedEndPanels =
    stacked && endSidebar
      ? endSidebar.panels.map((panel, index) =>
          index === 0
            ? {
                ...panel,
                actions: (
                  <>
                    {panel.actions}
                    <IconButton
                      ref={endCollapseRef}
                      label={nameOf(endSidebar)}
                      size="sm"
                      tooltipSide="bottom"
                      onClick={() => changeEndCollapsed(true)}
                    >
                      <ArrowLineRightIcon />
                    </IconButton>
                  </>
                ),
              }
            : panel,
        )
      : [];

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
        {/* The start sidebar keeps its place in every arrangement, so it
            keeps its state (and moves focus itself) as stacking changes. */}
        {startSidebar &&
          (stacked && endSidebar ? (
            // Reading order follows the eye: the column top to bottom, then
            // the main column.
            <Sidebar
              side="start"
              {...startSidebar}
              panels={[...startSidebar.panels, ...stackedEndPanels]}
              stackPanels
              // Which panel a rail button shows is the column's own state.
              activePanelId={undefined}
              onActivePanelChange={undefined}
              collapsed={false}
              onCollapsedChange={setStartCollapsed}
              labels={{
                ...startSidebar.labels,
                collapse: nameOf(startSidebar),
              }}
            />
          ) : (
            <Sidebar
              side="start"
              {...startSidebar}
              collapsed={startCollapsed}
              onCollapsedChange={setStartCollapsed}
            />
          ))}
        {mainColumn}
        {endSidebar && !stacked && (
          <Sidebar
            side="end"
            {...endSidebar}
            id={endId}
            collapsed={endCollapsed}
            onCollapsedChange={changeEndCollapsed}
          />
        )}
      </div>
    </div>
  );
}
