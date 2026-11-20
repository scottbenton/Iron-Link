import { Tabs } from "@base-ui/react/tabs";
import {
  ArrowLineLeftIcon,
  ArrowLineRightIcon,
  PushPinIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  CSSProperties,
  Fragment,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { focusRing } from "ui/styles/focus";

import { css, cva, cx } from "styled-system/css";

import { IconButton } from "../../components/IconButton";
import { CssProp, withCssProp } from "../../styles/cssProp";
import { LayoutPanel } from "../shared/layoutPanel";
import {
  sectionTabListStyles,
  sectionTabStyles,
  srOnlyStyles,
} from "../shared/sectionTabs";
import { useControllableState } from "../shared/useControllableState";
import { PanelInitial } from "./PanelInitial";
import { SidebarResizeHandle } from "./SidebarResizeHandle";
import { SidebarHeaderSlotContext } from "./sidebarHeaderSlotContext";

const rootStyles = cva({
  base: {
    boxSizing: "border-box",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    flex: "none",
    minHeight: 0,
    // The stored width, held to the room the main column leaves
    // (--sidebar-cap, set by GameLayout) but never under the minimum.
    width:
      "max(var(--sidebar-min-width), min(var(--sidebar-width), var(--sidebar-cap, 100%)))",
    background: "bg.muted",
    color: "fg.default",
    fontFamily: "body",
  },
  variants: {
    side: {
      start: { borderInlineEnd: "1px solid token(colors.border.default)" },
      end: { borderInlineStart: "1px solid token(colors.border.default)" },
    },
    collapsed: {
      true: {
        width: "56px",
        alignItems: "center",
        gap: "1",
        paddingBlock: "2",
        _touch: { width: "60px" },
      },
      false: {},
    },
  },
});

const expandedStyles = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
    minHeight: 0,
    "&[hidden]": { display: "none" },
    // Stacked panels: a rule between each shown panel and the next.
    "& > [data-stack-panel]:not([hidden]) ~ [data-stack-panel]": {
      borderTop: "1px solid token(colors.border.default)",
    },
  },
  variants: {
    /**
     * Shown from the collapsed rail: the column floats over the page beside
     * the rail, at the width it has when open, until the reader is done.
     */
    overlay: {
      true: {
        position: "absolute",
        zIndex: "calc(token(zIndex.sticky) + 1)",
        top: 0,
        bottom: 0,
        // Never wider than the room beside the rail.
        width:
          "min(var(--sidebar-width), calc(100cqi - var(--sidebar-rail-width) - 24px))",
        background: "bg.muted",
        borderColor: "border.control",
        borderStyle: "solid",
        borderWidth: 0,
        boxShadow: "float",
        outline: "none",
        animation: "fadeIn token(durations.fast) token(easings.out)",
        "[data-side=start] > &": {
          insetInlineStart: "calc(100% + 1px)",
          borderInlineEndWidth: "1px",
        },
        "[data-side=end] > &": {
          insetInlineEnd: "calc(100% + 1px)",
          borderInlineStartWidth: "1px",
        },
      },
      false: {},
    },
  },
  defaultVariants: { overlay: false },
});

const headerStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  flex: "none",
  minHeight: "52px",
  paddingBlock: "2",
  paddingInline: "3",
  borderBottom: "1px solid token(colors.border.subtle)",
});

const headerTitleStyles = css({
  flex: "1 1 auto",
  minWidth: 0,
  margin: 0,
  paddingInlineStart: "1",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "lg",
  lineHeight: "tight",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  outline: "none",
});

const headerActionsStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "0.5",
  flex: "none",
});

const panelStyles = css({
  position: "relative",
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
  outline: "none",
  "&[hidden]": { display: "none" },
  _focusVisible: focusRing.inset,
});

/** One of several panels shown at once, sharing the column's height. */
const stackPanelStyles = css({
  display: "flex",
  flexDirection: "column",
  flex: "1 1 0",
  minHeight: 0,
  "&[hidden]": { display: "none" },
});

/** The rail's button for the section showing over the page. */
const railButtonStyles = css({
  "&[aria-expanded=true]": {
    background: "overlay.selected",
    color: "fg.default",
  },
});

/**
 * One sidebar's buttons on a rail several sidebars share: its Expand, then
 * its sections. A rule across the rail separates it from the group before.
 */
const railGroupStyles = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  alignSelf: "stretch",
  gap: "1",
  "& + &": {
    marginBlockStart: "2",
    paddingBlockStart: "3",
    borderTop: "1px solid token(colors.border.default)",
  },
});

const railDividerStyles = css({
  width: "24px",
  height: "1px",
  marginBlock: "1",
  background: "border.default",
});

export interface SidebarLabels {
  collapse?: string;
  /** The rail's button that opens the sidebar in place again. */
  expand?: string;
  /**
   * Shown in a column opened over the page from the rail: keeps the
   * sidebar open in place, as Expand does.
   */
  dock?: string;
  /** Closes a column opened over the page from the rail. */
  closeOverlay?: string;
  resize?: string;
  /** The tab list's name, where panels share the sidebar. */
  tabs?: string;
}

/** One sidebar's share of a rail that several share (`railGroups`). */
export interface SidebarRailGroup {
  /** Its sidebar's name, read as the group's name: "Character Sheet". */
  label: string;
  /** The panels it holds, by id, in the order the rail shows them. */
  panelIds: string[];
  /** Its Expand, which opens its own sidebar. */
  expandLabel: string;
  onExpand: () => void;
  /**
   * Its sidebar can be kept open (the default). False drops its Expand and
   * its Keep Open, as the sidebar's own `pinnable` does.
   */
  pinnable?: boolean;
  /** The group's DOM id, so the app can move focus into it. */
  id?: string;
}

export interface SidebarProps
  extends Omit<CssProp, "width" | "minWidth" | "maxWidth"> {
  /**
   * What the sidebar holds: usually one panel (the game page has the
   * character sheet in one sidebar and the reference in the other), or
   * several behind section tabs. Each panel's title is its h2.
   */
  panels: LayoutPanel[];
  /** The panel showing. Uncontrolled without it. */
  activePanelId?: string;
  onActivePanelChange?: (panelId: string) => void;
  /**
   * Collapsed to a rail: a button per section of each panel (or per panel,
   * for panels without sections). A rail button shows that section over the
   * page, beside the rail, without opening the sidebar: Escape, a press
   * elsewhere or moving focus out closes it, and focus goes back to the
   * button. Expand, at the top of the rail, opens the sidebar in place.
   * Uncontrolled without it.
   */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /**
   * The width in pixels. Controlled: the app keeps and persists it.
   * `onWidthChange` fires once per drag (on release) and per key press.
   */
  width?: number;
  onWidthChange?: (width: number) => void;
  /** The width before the reader picks one, and a double click's reset. */
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  /** Which side of the main column it sits on. */
  side?: "start" | "end";
  /** Offer the resize handle. */
  resizable?: boolean;
  /** Offer collapsing to a rail. */
  collapsible?: boolean;
  /**
   * Let the reader keep the sidebar open in place (the default). False
   * holds it on its rail: no Expand on the rail and no Keep Open in a
   * section shown over the page, so it only opens over the page and closes
   * again. For widths where an open sidebar would squeeze the main column
   * too far, such as the sheet first layout below 1200px. The `collapsed`
   * state is kept, so the reader's choice comes back when it is pinnable
   * again.
   */
  pinnable?: boolean;
  /**
   * Show every panel at once, one over another, each under its own h2
   * header and sharing the height, instead of behind tabs: the game page's
   * medium layout, the character sheet over the reference. Collapsing folds
   * them into one rail, each panel's sections after a divider, and a rail
   * button shows just that panel over the page. Collapse sits in the first
   * panel's header. A panel whose content renders `SidebarHeaderEnd` (in its
   * tab well) drops the visible header: its controls move there and its
   * title stays as a screen reader h2.
   */
  stackPanels?: boolean;
  labels?: SidebarLabels;
  /**
   * Collapsed, one rail for several sidebars (the game page's sheet and
   * reference while both sit before the notes): the rail splits into these
   * groups, each with its own Expand and its own sections. Keep Open, from
   * a section shown over the page, opens that section's sidebar. Use with
   * `stackPanels` and every sidebar's panels.
   */
  railGroups?: SidebarRailGroup[];
  id?: string;
  className?: string;
}

/**
 * A side column of the game page: the character sheet or the reference.
 * The reader can resize it with the handle on its inner edge and collapse
 * it to a rail of section buttons, each of which shows that section over
 * the page for a moment; the app owns the width and collapsed state so it
 * can remember them.
 *
 * A panel whose content renders `SidebarHeaderEnd` (in its tab well) drops
 * its visible header: the controls sit in the well and the title stays as
 * a screen reader h2, so the column's tabs line up with the notes tabs.
 *
 * Panels stay mounted while hidden, so a panel keeps its scroll position
 * and open sections when the reader switches away and back.
 */
export function Sidebar(props: SidebarProps) {
  const {
    panels,
    activePanelId: activePanelIdProp,
    onActivePanelChange,
    collapsed: collapsedProp,
    onCollapsedChange,
    width: widthProp,
    onWidthChange,
    defaultWidth = 360,
    minWidth = 280,
    maxWidth = 560,
    side = "start",
    resizable = true,
    collapsible = true,
    pinnable = true,
    stackPanels = false,
    labels,
    railGroups,
    id: idProp,
    className,
  } = withCssProp(props);

  const {
    collapse: collapseLabel = "Collapse Sidebar",
    expand: expandLabel = "Expand Sidebar",
    dock: dockLabel = "Keep Sidebar Open",
    closeOverlay: closeOverlayLabel = "Close",
    resize: resizeLabel = "Resize Sidebar",
    tabs: tabsLabel = "Sidebar Sections",
  } = labels ?? {};

  const generatedId = useId();
  const id = idProp ?? `sidebar${generatedId.replace(/:/g, "")}`;

  const [activePanelId, setActivePanelId] = useControllableState(
    activePanelIdProp,
    panels[0]?.id ?? "",
    onActivePanelChange,
  );
  const [collapsedState, setCollapsed] = useControllableState(
    collapsedProp,
    false,
    onCollapsedChange,
  );
  // Not pinnable: always on the rail, whatever the reader last chose.
  const collapsed = collapsedState || !pinnable;
  const [width, setWidth] = useControllableState(
    widthProp,
    defaultWidth,
    onWidthChange,
  );

  // The section shown over the page from the collapsed rail.
  const [peek, setPeek] = useState<{
    panelId: string;
    sectionId?: string;
  } | null>(null);
  const peeking = collapsed && peek !== null;
  const overlayRef = useRef<HTMLDivElement>(null);
  const peekTriggerRef = useRef<HTMLElement | null>(null);
  const peekFocus = useRef<"in" | "trigger" | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const expandButtonRef = useRef<HTMLElement>(null);
  const collapseButtonRef = useRef<HTMLElement>(null);
  const tabRefs = useRef(new Map<string, HTMLElement>());
  // Where focus goes once a collapse or expand has rendered: the control
  // the reader used is gone, so focus moves to its counterpart.
  const pendingFocus = useRef<
    | { kind: "expand" }
    | { kind: "collapse" }
    | { kind: "tab"; id: string }
    | null
  >(null);

  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending) return;
    pendingFocus.current = null;
    if (pending.kind === "expand") expandButtonRef.current?.focus();
    else if (pending.kind === "collapse") collapseButtonRef.current?.focus();
    else
      (tabRefs.current.get(pending.id) ?? collapseButtonRef.current)?.focus();
  }, [collapsed]);

  // Expanding (from here or by the app) ends a peek.
  useEffect(() => {
    if (!collapsed) setPeek(null);
  }, [collapsed]);

  const activePanel =
    panels.find((panel) => panel.id === activePanelId) ?? panels[0];
  const stacked = stackPanels && panels.length > 1;

  // Stacked panels whose content shows the header's controls itself
  // (`SidebarHeaderEnd`, in the tab well): their visible header goes.
  const [claimedPanels, setClaimedPanels] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const claimHeader = useCallback((panelId: string) => {
    setClaimedPanels((current) => new Set(current).add(panelId));
    return () =>
      setClaimedPanels((current) => {
        const next = new Set(current);
        next.delete(panelId);
        return next;
      });
  }, []);
  // Several panels behind tabs; stacked panels each keep a visible h2.
  const tabbed = panels.length > 1 && !stacked;
  const clampedWidth = Math.min(maxWidth, Math.max(minWidth, width));

  const closePeek = (returnFocus: boolean) => {
    peekFocus.current = returnFocus ? "trigger" : null;
    setPeek(null);
  };

  const openPeek = (
    trigger: HTMLElement,
    panel: LayoutPanel,
    sectionId?: string,
  ) => {
    const showing =
      peeking &&
      peek?.panelId === panel.id &&
      (sectionId === undefined ||
        (panel.activeSectionId ?? peek?.sectionId) === sectionId);
    if (showing) {
      closePeek(true);
      return;
    }
    peekTriggerRef.current = trigger;
    setActivePanelId(panel.id);
    if (sectionId) panel.onActiveSectionChange?.(sectionId);
    // Moving between rail buttons keeps focus on the rail.
    peekFocus.current = peeking ? null : "in";
    setPeek({ panelId: panel.id, sectionId });
  };

  // On a shared rail, the group a panel belongs to, and whether it is the
  // first (this sidebar's own, which keeps its place when it opens).
  const groupIndexOf = (panelId: string | undefined) =>
    railGroups?.findIndex((group) => group.panelIds.includes(panelId ?? ""));

  const expandGroup = (index: number) => {
    const group = railGroups?.[index];
    if (!group) return;
    // Another group's sidebar opens elsewhere and moves focus itself.
    pendingFocus.current = index === 0 ? { kind: "collapse" } : null;
    setPeek(null);
    group.onExpand();
  };

  // Keep Open shows only where the shown section's sidebar can stay open.
  const peekGroupIndex = groupIndexOf(peek?.panelId);
  const canDockPeek =
    peekGroupIndex !== undefined && peekGroupIndex >= 0
      ? railGroups?.[peekGroupIndex]?.pinnable !== false
      : pinnable;

  const dock = () => {
    const groupIndex = groupIndexOf(peek?.panelId);
    if (groupIndex !== undefined && groupIndex >= 0) {
      expandGroup(groupIndex);
      return;
    }
    pendingFocus.current = { kind: "collapse" };
    setPeek(null);
    setCollapsed(false);
  };

  // Focus moves into the column when it opens, and back to its rail button
  // when Escape or Close shuts it.
  useEffect(() => {
    const target = peekFocus.current;
    peekFocus.current = null;
    if (target === "trigger") {
      peekTriggerRef.current?.focus();
    } else if (target === "in" && peek) {
      const tab = tabbed ? tabRefs.current.get(peek.panelId) : undefined;
      // The shown panel's heading: stacked panels hide the others.
      const heading = Array.from(
        overlayRef.current?.querySelectorAll<HTMLElement>("h2") ?? [],
      ).find((element) => !element.closest("[hidden]"));
      (tab ?? heading ?? overlayRef.current)?.focus();
    }
  }, [peek, tabbed]);

  // Escape, a press on the page or focus moving to the page closes it.
  // Presses and focus in popups the column opened (menus, dialogs: other
  // top-level nodes in the document) leave it open.
  useEffect(() => {
    const overlay = overlayRef.current;
    const root = rootRef.current;
    if (!peeking || !overlay || !root) return;
    const onPage = (node: EventTarget | null) =>
      node instanceof Node &&
      node.isConnected &&
      !root.contains(node) &&
      topLevelNode(node) === topLevelNode(root);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      closePeek(true);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (onPage(event.target)) closePeek(false);
    };
    const onFocusOut = (event: FocusEvent) => {
      if (onPage(event.relatedTarget)) closePeek(false);
    };
    overlay.addEventListener("keydown", onKeyDown);
    overlay.addEventListener("focusout", onFocusOut);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      overlay.removeEventListener("keydown", onKeyDown);
      overlay.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [peeking]);

  const collapse = () => {
    pendingFocus.current = { kind: "expand" };
    setCollapsed(true);
  };
  const expand = (panelId?: string) => {
    if (panelId) {
      setActivePanelId(panelId);
      pendingFocus.current = tabbed
        ? { kind: "tab", id: panelId }
        : { kind: "collapse" };
    } else {
      pendingFocus.current = { kind: "collapse" };
    }
    setCollapsed(false);
  };

  const panelDomId = (panelId: string) => `${id}-panel-${panelId}`;
  const headingDomId = (panel: LayoutPanel) =>
    panel.headingId ?? `${id}-heading-${panel.id}`;

  const collapseIcon =
    side === "start" ? <ArrowLineLeftIcon /> : <ArrowLineRightIcon />;
  const expandIcon =
    side === "start" ? <ArrowLineRightIcon /> : <ArrowLineLeftIcon />;
  const tooltipSide = side === "start" ? "right" : "left";
  const overlayId = `${id}-overlay`;

  // A panel header's actions, then (with `controls`) the sidebar's own:
  // Collapse, or Keep Open and Close while it shows over the page.
  const renderHeaderEnd = (panel: LayoutPanel | undefined, controls = true) => (
    <div className={headerActionsStyles}>
      {panel?.actions}
      {!controls ? null : peeking ? (
        <>
          {canDockPeek && (
            <IconButton
              label={dockLabel}
              size="sm"
              tooltipSide="bottom"
              onClick={dock}
            >
              <PushPinIcon />
            </IconButton>
          )}
          <IconButton
            label={closeOverlayLabel}
            size="sm"
            tooltipSide="bottom"
            onClick={() => closePeek(true)}
          >
            <XIcon />
          </IconButton>
        </>
      ) : (
        collapsible && (
          <IconButton
            ref={collapseButtonRef}
            label={collapseLabel}
            size="sm"
            tooltipSide="bottom"
            onClick={collapse}
          >
            {collapseIcon}
          </IconButton>
        )
      )}
    </div>
  );

  // A single panel's header, in its header or, where its content renders
  // `SidebarHeaderEnd`, its well.
  const singleEnd = renderHeaderEnd(activePanel);
  const singleInContent =
    !peeking && !!activePanel && claimedPanels.has(activePanel.id);

  // While it shows over the page, the column is a non-modal dialog named
  // by its heading.
  const overlayProps = peeking
    ? {
        id: overlayId,
        ref: overlayRef,
        role: "dialog",
        "aria-labelledby": activePanel ? headingDomId(activePanel) : undefined,
      }
    : {};

  // A rail's buttons for these panels: each panel's sections (or the
  // panel itself) after a divider.
  const renderRailPanels = (railPanels: LayoutPanel[]) =>
    railPanels.map((panel) => {
      const showing = peeking && peek?.panelId === panel.id;
      const sections = panel.sections ?? [];
      return (
        <Fragment key={panel.id}>
          <span className={railDividerStyles} aria-hidden="true" />
          {sections.length > 0 ? (
            sections.map((section) => (
              <IconButton
                key={section.id}
                label={section.title}
                tooltipSide={tooltipSide}
                className={railButtonStyles}
                aria-expanded={
                  showing &&
                  (panel.activeSectionId ?? peek?.sectionId) === section.id
                }
                aria-controls={showing ? overlayId : undefined}
                onClick={(event) =>
                  openPeek(event.currentTarget, panel, section.id)
                }
              >
                {section.icon}
              </IconButton>
            ))
          ) : (
            <IconButton
              label={panel.title}
              tooltipSide={tooltipSide}
              className={railButtonStyles}
              aria-expanded={showing}
              aria-controls={showing ? overlayId : undefined}
              onClick={(event) => openPeek(event.currentTarget, panel)}
            >
              {panel.icon ?? <PanelInitial title={panel.title} />}
            </IconButton>
          )}
        </Fragment>
      );
    });

  const renderPanelBody = (panel: LayoutPanel) => (
    <>
      {tabbed && (
        // The tab names the panel visually; the heading keeps the column's
        // h2 for heading navigation.
        <h2 id={headingDomId(panel)} tabIndex={-1} className={srOnlyStyles}>
          {panel.title}
        </h2>
      )}
      {panel.content}
    </>
  );

  return (
    <div
      ref={rootRef}
      id={id}
      className={cx(rootStyles({ side, collapsed }), className)}
      style={
        {
          "--sidebar-width": `${clampedWidth}px`,
          "--sidebar-min-width": `${minWidth}px`,
          "--sidebar-rail-width": "60px",
        } as CSSProperties
      }
      data-side={side}
      data-collapsed={collapsed || undefined}
    >
      {collapsed &&
        (railGroups ? (
          railGroups.map((group, index) => (
            <div
              key={group.id ?? index}
              id={group.id}
              role="group"
              aria-label={group.label}
              className={railGroupStyles}
            >
              {group.pinnable !== false && (
                <IconButton
                  ref={index === 0 ? expandButtonRef : undefined}
                  label={group.expandLabel}
                  tooltipSide={tooltipSide}
                  onClick={() => expandGroup(index)}
                >
                  {expandIcon}
                </IconButton>
              )}
              {renderRailPanels(
                panels.filter((panel) => group.panelIds.includes(panel.id)),
              )}
            </div>
          ))
        ) : (
          <>
            {pinnable && (
              <IconButton
                ref={expandButtonRef}
                label={expandLabel}
                tooltipSide={tooltipSide}
                onClick={() => expand()}
              >
                {expandIcon}
              </IconButton>
            )}
            {renderRailPanels(panels)}
          </>
        ))}

      {tabbed ? (
        <Tabs.Root
          value={activePanel?.id}
          onValueChange={(value) => setActivePanelId(String(value))}
          className={expandedStyles({ overlay: peeking })}
          hidden={collapsed && !peeking}
          {...overlayProps}
        >
          <div className={headerStyles}>
            <Tabs.List
              aria-label={tabsLabel}
              className={sectionTabListStyles}
              activateOnFocus
            >
              {panels.map((panel) => (
                <Tabs.Tab
                  key={panel.id}
                  value={panel.id}
                  className={sectionTabStyles}
                  ref={(element: HTMLElement | null) => {
                    if (element) tabRefs.current.set(panel.id, element);
                    else tabRefs.current.delete(panel.id);
                  }}
                >
                  {panel.title}
                </Tabs.Tab>
              ))}
            </Tabs.List>
            {renderHeaderEnd(activePanel)}
          </div>
          {panels.map((panel) => (
            <Tabs.Panel
              key={panel.id}
              value={panel.id}
              id={panelDomId(panel.id)}
              keepMounted
              className={panelStyles}
            >
              {renderPanelBody(panel)}
            </Tabs.Panel>
          ))}
        </Tabs.Root>
      ) : stacked ? (
        <div
          className={expandedStyles({ overlay: peeking })}
          hidden={collapsed && !peeking}
          {...overlayProps}
        >
          {panels.map((panel, index) => {
            // Over the page, only the panel its rail button opened shows.
            const shown = !peeking || panel.id === activePanel?.id;
            const end = renderHeaderEnd(panel, peeking ? shown : index === 0);
            // Over the page the header stays, with Keep Open and Close.
            const inContent = !peeking && claimedPanels.has(panel.id);
            return (
              <div
                key={panel.id}
                data-stack-panel=""
                className={stackPanelStyles}
                hidden={!shown}
              >
                {inContent ? (
                  <h2
                    id={headingDomId(panel)}
                    tabIndex={-1}
                    className={srOnlyStyles}
                  >
                    {panel.title}
                  </h2>
                ) : (
                  <div className={headerStyles}>
                    <h2
                      id={headingDomId(panel)}
                      tabIndex={-1}
                      className={headerTitleStyles}
                    >
                      {panel.title}
                    </h2>
                    {end}
                  </div>
                )}
                <div id={panelDomId(panel.id)} className={panelStyles}>
                  <SidebarHeaderSlotContext.Provider
                    value={{
                      panelId: panel.id,
                      end,
                      claimed: inContent,
                      claim: claimHeader,
                    }}
                  >
                    {panel.content}
                  </SidebarHeaderSlotContext.Provider>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        activePanel && (
          <div
            className={expandedStyles({ overlay: peeking })}
            hidden={collapsed && !peeking}
            {...overlayProps}
          >
            {singleInContent ? (
              <h2
                id={headingDomId(activePanel)}
                tabIndex={-1}
                className={srOnlyStyles}
              >
                {activePanel.title}
              </h2>
            ) : (
              <div className={headerStyles}>
                <h2
                  id={headingDomId(activePanel)}
                  tabIndex={-1}
                  className={headerTitleStyles}
                >
                  {activePanel.title}
                </h2>
                {singleEnd}
              </div>
            )}
            <div id={panelDomId(activePanel.id)} className={panelStyles}>
              <SidebarHeaderSlotContext.Provider
                value={{
                  panelId: activePanel.id,
                  end: singleEnd,
                  claimed: singleInContent,
                  claim: claimHeader,
                }}
              >
                {activePanel.content}
              </SidebarHeaderSlotContext.Provider>
            </div>
          </div>
        )
      )}

      {resizable && !collapsed && (
        <SidebarResizeHandle
          targetId={id}
          targetRef={rootRef}
          side={side}
          width={clampedWidth}
          minWidth={minWidth}
          maxWidth={maxWidth}
          defaultWidth={defaultWidth}
          onWidthChange={setWidth}
          onCollapse={collapsible ? collapse : undefined}
          label={resizeLabel}
        />
      )}
    </div>
  );
}

/**
 * The node under the document's body that holds this one: the app's root,
 * or a popup's portal.
 */
function topLevelNode(node: Node): Node {
  let current = node;
  while (
    current.parentNode &&
    current.parentNode !== current.ownerDocument?.body &&
    current.parentNode !== current.ownerDocument
  ) {
    current = current.parentNode;
  }
  return current;
}
