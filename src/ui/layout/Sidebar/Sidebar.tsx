import { Tabs } from "@base-ui/react/tabs";
import { ArrowLineLeftIcon, ArrowLineRightIcon } from "@phosphor-icons/react";
import { CSSProperties, ReactNode, useEffect, useId, useRef } from "react";

import { css, cva, cx } from "styled-system/css";

import { IconButton } from "../../components/IconButton";
import { LayoutPanel } from "../shared/layoutPanel";
import {
  sectionTabListStyles,
  sectionTabStyles,
  srOnlyStyles,
} from "../shared/sectionTabs";
import { useControllableState } from "../shared/useControllableState";
import { SidebarResizeHandle } from "./SidebarResizeHandle";

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

const expandedStyles = css({
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  minHeight: 0,
  "&[hidden]": { display: "none" },
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
  fontWeight: "semibold",
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
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "-2px",
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
  expand?: string;
  resize?: string;
  /** The tab list's name, where panels share the sidebar. */
  tabs?: string;
}

export interface SidebarProps {
  /**
   * What the sidebar holds: one panel, or several behind section tabs
   * (Character and Reference). Each panel's title is its h2.
   */
  panels: LayoutPanel[];
  /** The panel showing. Uncontrolled without it. */
  activePanelId?: string;
  onActivePanelChange?: (panelId: string) => void;
  /** Collapsed to a rail of panel buttons. Uncontrolled without it. */
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
  labels?: SidebarLabels;
  id?: string;
  className?: string;
}

/**
 * A side column of the game page: the character sheet, the reference, or
 * both behind section tabs. The reader can resize it with the handle on its
 * inner edge and collapse it to a rail of panel buttons; the app owns the
 * width and collapsed state so it can remember them.
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
    labels,
    id: idProp,
    className,
  } = props;

  const {
    collapse: collapseLabel = "Collapse Sidebar",
    expand: expandLabel = "Expand Sidebar",
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
  const [collapsed, setCollapsed] = useControllableState(
    collapsedProp,
    false,
    onCollapsedChange,
  );
  const [width, setWidth] = useControllableState(
    widthProp,
    defaultWidth,
    onWidthChange,
  );

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

  const activePanel =
    panels.find((panel) => panel.id === activePanelId) ?? panels[0];
  const multiple = panels.length > 1;
  const clampedWidth = Math.min(maxWidth, Math.max(minWidth, width));

  const collapse = () => {
    pendingFocus.current = { kind: "expand" };
    setCollapsed(true);
  };
  const expand = (panelId?: string) => {
    if (panelId) {
      setActivePanelId(panelId);
      pendingFocus.current = multiple
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

  const headerEnd = (
    <div className={headerActionsStyles}>
      {activePanel?.actions}
      {collapsible && (
        <IconButton
          ref={collapseButtonRef}
          label={collapseLabel}
          size="sm"
          tooltipSide="bottom"
          onClick={collapse}
        >
          {collapseIcon}
        </IconButton>
      )}
    </div>
  );

  const renderPanelBody = (panel: LayoutPanel) => (
    <>
      {multiple && (
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
        } as CSSProperties
      }
      data-side={side}
      data-collapsed={collapsed || undefined}
    >
      {collapsed && (
        <>
          <IconButton
            ref={expandButtonRef}
            label={expandLabel}
            tooltipSide={tooltipSide}
            onClick={() => expand()}
          >
            {expandIcon}
          </IconButton>
          <span className={railDividerStyles} aria-hidden="true" />
          {panels.map((panel) => (
            <IconButton
              key={panel.id}
              label={panel.title}
              tooltipSide={tooltipSide}
              onClick={() => expand(panel.id)}
            >
              {panel.icon ?? <PanelInitial title={panel.title} />}
            </IconButton>
          ))}
        </>
      )}

      {multiple ? (
        <Tabs.Root
          value={activePanel?.id}
          onValueChange={(value) => setActivePanelId(String(value))}
          className={expandedStyles}
          hidden={collapsed}
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
            {headerEnd}
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
      ) : (
        activePanel && (
          <div className={expandedStyles} hidden={collapsed}>
            <div className={headerStyles}>
              <h2
                id={headingDomId(activePanel)}
                tabIndex={-1}
                className={headerTitleStyles}
              >
                {activePanel.title}
              </h2>
              {headerEnd}
            </div>
            <div id={panelDomId(activePanel.id)} className={panelStyles}>
              {activePanel.content}
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

const initialStyles = css({
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "md",
  lineHeight: "none",
});

/** The first letter of a panel without an icon, for the collapsed rail. */
function PanelInitial(props: { title: string }): ReactNode {
  return (
    <span className={initialStyles} aria-hidden="true">
      {props.title.trim().charAt(0).toUpperCase()}
    </span>
  );
}
