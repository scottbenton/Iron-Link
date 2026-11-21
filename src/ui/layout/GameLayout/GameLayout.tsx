import { ArrowLineLeftIcon } from "@phosphor-icons/react";
import {
  CSSProperties,
  Fragment,
  ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";

import { focusRing } from "ui/styles/focus";

import { css, cx } from "styled-system/css";

import { IconButton } from "../../components/IconButton";
import { useControllableState } from "../../hooks/useControllableState";
import { Sidebar, SidebarProps } from "../Sidebar";
import { LayoutPanel } from "../shared/layoutPanel";
import { srOnlyStyles } from "../shared/sectionTabs";

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
  // Rails take their width from the main column, not the open sidebars:
  // the room left after the main column's minimum and the rails is shared
  // among the open sidebars only.
  "--game-rail-width": "57px",
  _touch: { "--game-rail-width": "61px" },
  "--sidebar-cap":
    "calc((100cqi - var(--game-main-min-width, 360px) - var(--game-rail-count, 0) * var(--game-rail-width)) / var(--game-sidebar-count, 1))",
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
   * Put both sidebars on the start side of the main column, as the live app
   * does between 900 and 1200px; the library does it from 600px, the edge of
   * `useIsMobile()`. Pass `!useBreakpoint("greater-than", "lg")`. From 600
   * to 900px also make both sidebars not `pinnable`, so they share one rail
   * and open as flyouts over the notes. Each sidebar is pinned open or collapsed to a rail on its own,
   * and all of it sits at the start: with both open, the end sidebar stacks
   * under the start one in a single column (with the start sidebar's width
   * and resize handle, and the end one's Collapse in its first panel's
   * header); with one collapsed, its rail sits first, before the open
   * column, and takes its width from the main column; with both collapsed,
   * one rail holding both, each sidebar's Expand and sections in its own
   * group. So the reader can keep the sheet open with the reference on a
   * rail, the other way round, or both, and the main column never moves
   * between sides.
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
 * sidebars; between 900 and 1200px both sit at the start, the sheet and the
 * reference in one column while both are open (`stackSidebars`), and from
 * 600 to 900px they stay on one rail and open as flyouts (`stackSidebars`
 * with neither sidebar `pinnable`). Phones, below 600px, use a layout of
 * their own (the phone game page), not this one.
 */
export function GameLayout(props: GameLayoutProps) {
  const { t } = useTranslation();
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
  const [startCollapsedState, setStartCollapsed] = useControllableState(
    startSidebar?.collapsed,
    false,
    startSidebar?.onCollapsedChange,
  );
  const [endCollapsedState, setEndCollapsed] = useControllableState(
    endSidebar?.collapsed,
    false,
    endSidebar?.onCollapsedChange,
  );
  // A sidebar that can't be pinned is always on its rail.
  const startCollapsed =
    startCollapsedState || startSidebar?.pinnable === false;
  const endCollapsed = endCollapsedState || endSidebar?.pinnable === false;
  // The end sidebar's width lives here, so it survives the end sidebar
  // folding into the start one's rail and coming out again.
  const [endWidth, setEndWidth] = useControllableState(
    endSidebar?.width,
    endSidebar?.defaultWidth ?? 360,
    endSidebar?.onWidthChange,
  );

  const canStack = stackSidebars && !!startSidebar && !!endSidebar;
  // Stacking puts every sidebar at the start, open or on a rail.
  const endSide = canStack ? "start" : "end";
  const stacked = canStack && !startCollapsed && !endCollapsed;
  // Both on rails: one rail, in the start sidebar's place.
  const sharedRail = canStack && startCollapsed && endCollapsed;

  // Stacking or unstacking swaps the end sidebar between its own column and
  // the stacked one, so the control the reader used goes. Focus moves to its
  // counterpart: the rail's Expand, or the stacked column's Collapse.
  const endCollapseRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"endExpand" | "endCollapse" | "endOpen" | null>(
    null,
  );
  const endCollapseLabel =
    endSidebar?.labels?.collapse ??
    t("ui.sidebar.collapse", "Collapse Sidebar");
  useEffect(() => {
    const pending = pendingFocus.current;
    pendingFocus.current = null;
    const end = document.getElementById(endId);
    if (pending === "endCollapse") endCollapseRef.current?.focus();
    // The end rail, or its group on the shared rail, starts with Expand.
    else if (pending === "endExpand")
      end?.querySelector<HTMLElement>("button")?.focus();
    else if (pending === "endOpen")
      end
        ?.querySelector<HTMLElement>(
          `button[aria-label="${CSS.escape(endCollapseLabel)}"]`,
        )
        ?.focus();
  }, [endCollapsed, endId, endCollapseLabel]);

  const changeEndCollapsed = (collapsed: boolean) => {
    if (canStack) {
      pendingFocus.current = collapsed
        ? "endExpand"
        : startCollapsed
          ? "endOpen"
          : "endCollapse";
    }
    setEndCollapsed(collapsed);
  };

  const bannerSlot = banner && (
    <div className={bannerStyles} data-part="banner">
      {banner}
    </div>
  );

  // Open columns share the room the main column leaves; rails come out of
  // the main column's share.
  const startOpen = !!startSidebar && !startCollapsed;
  const endOpen = !!endSidebar && !endCollapsed;
  const sidebarCount = stacked ? 1 : (startOpen ? 1 : 0) + (endOpen ? 1 : 0);
  const railCount = sharedRail
    ? 1
    : (startSidebar && startCollapsed ? 1 : 0) +
      (endSidebar && endCollapsed ? 1 : 0);

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
    sidebar.labels?.collapse ??
    t("ui.game-layout.collapse-named", "Collapse {{name}}", {
      name: sidebar.panels[0]?.title ?? "",
    });
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
                      <ArrowLineLeftIcon />
                    </IconButton>
                  </>
                ),
              }
            : panel,
        )
      : [];

  const endSidebarColumn = endSidebar && !stacked && !sharedRail && (
    <Sidebar
      key="end"
      side={endSide}
      {...endSidebar}
      id={endId}
      width={endWidth}
      onWidthChange={setEndWidth}
      collapsed={endCollapsed}
      onCollapsedChange={changeEndCollapsed}
    />
  );

  const titleOf = (sidebar: GameSidebar) => sidebar.panels[0]?.title ?? "";

  // The start sidebar keeps its place (its key) in every arrangement, so it
  // keeps its state (and moves focus itself) as stacking changes.
  let startSidebarColumn: ReactNode = null;
  if (startSidebar && stacked && endSidebar) {
    // Reading order follows the eye: the column top to bottom, then the
    // main column.
    startSidebarColumn = (
      <Sidebar
        key="start"
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
    );
  } else if (startSidebar && sharedRail && endSidebar) {
    // One rail for both, each sidebar's Expand and sections in a group.
    startSidebarColumn = (
      <Sidebar
        key="start"
        side="start"
        {...startSidebar}
        panels={[...startSidebar.panels, ...endSidebar.panels]}
        stackPanels
        activePanelId={undefined}
        onActivePanelChange={undefined}
        collapsed
        onCollapsedChange={setStartCollapsed}
        railGroups={[
          {
            label: titleOf(startSidebar),
            panelIds: startSidebar.panels.map((panel) => panel.id),
            expandLabel:
              startSidebar.labels?.expand ??
              t("ui.game-layout.expand-named", "Expand {{name}}", {
                name: titleOf(startSidebar),
              }),
            onExpand: () => setStartCollapsed(false),
            pinnable: startSidebar.pinnable,
          },
          {
            id: endId,
            label: titleOf(endSidebar),
            panelIds: endSidebar.panels.map((panel) => panel.id),
            expandLabel:
              endSidebar.labels?.expand ??
              t("ui.game-layout.expand-named", "Expand {{name}}", {
                name: titleOf(endSidebar),
              }),
            onExpand: () => changeEndCollapsed(false),
            pinnable: endSidebar.pinnable,
          },
        ]}
      />
    );
  } else if (startSidebar) {
    startSidebarColumn = (
      <Sidebar
        key="start"
        side="start"
        {...startSidebar}
        collapsed={startCollapsed}
        onCollapsedChange={setStartCollapsed}
      />
    );
  }

  // Columns in order. Stacking, a rail sits before the open column, so the
  // open one stays beside the main column; otherwise the end sidebar
  // follows the main column. Keys keep each column's state as they move.
  const mainSlot = <Fragment key="main">{mainColumn}</Fragment>;
  const columns: ReactNode[] =
    endSide === "start"
      ? endCollapsed && !startCollapsed
        ? [endSidebarColumn, startSidebarColumn, mainSlot]
        : [startSidebarColumn, endSidebarColumn, mainSlot]
      : [startSidebarColumn, mainSlot, endSidebarColumn];

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
            "--game-rail-count": railCount,
          } as CSSProperties
        }
      >
        {columns}
      </div>
    </div>
  );
}
