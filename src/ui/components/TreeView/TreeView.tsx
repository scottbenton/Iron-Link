import { CaretRight } from "@phosphor-icons/react";
import {
  CSSProperties,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cva, cx } from "styled-system/css";

import { Spinner } from "../Spinner";
import { VisuallyHidden } from "../VisuallyHidden";

export interface TreeViewItem<T = unknown> {
  /** Unique across the whole tree. */
  id: string;
  /** The item's name: its text, and what type-ahead matches. */
  label: string;
  /** Child items. Leave undefined with `hasChildren` to load them later. */
  children?: TreeViewItem<T>[];
  /**
   * The item has children that are not loaded yet. Opening it calls
   * `onLoadChildren`, and it shows a spinner until `children` arrives.
   */
  hasChildren?: boolean;
  /** An icon before the label, such as a folder. */
  icon?: ReactNode;
  disabled?: boolean;
  /**
   * Whether the item can be selected. Off for groups that only open, such
   * as move categories. On by default.
   */
  selectable?: boolean;
  /** Anything the render slots need. */
  data?: T;
}

export interface TreeViewItemState {
  level: number;
  expanded: boolean;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
  hasChildren: boolean;
  loading: boolean;
}

export interface TreeViewProps<T = unknown> extends LayoutProps {
  items: TreeViewItem<T>[];
  /** Names the tree, such as "Moves" or "Destinations". */
  "aria-label": string;

  /**
   * The selected item, for a tree you pick from (a folder to move into, an
   * oracle). Leave `selectedId` and `onSelectedChange` out for a tree whose
   * items only act, through `onItemActivate`.
   */
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelectedChange?: (id: string, item: TreeViewItem<T>) => void;

  /** Open items. Controlled with `expandedIds`, or start from the default. */
  expandedIds?: string[];
  defaultExpandedIds?: string[];
  onExpandedChange?: (ids: string[]) => void;

  /**
   * Called when an item is clicked or gets Enter or Space, after any
   * selection: open the move, insert the oracle.
   */
  onItemActivate?: (item: TreeViewItem<T>) => void;
  /** Loads an item's children when it opens (see `hasChildren`). */
  onLoadChildren?: (item: TreeViewItem<T>) => void | Promise<void>;

  /** Replaces the label text, such as to add a count or a highlight. */
  renderLabel?: (item: TreeViewItem<T>, state: TreeViewItemState) => ReactNode;
  /**
   * Buttons at the end of a row, such as Roll. They can be reached with Tab
   * from the focused row, and their keys never move through the tree.
   */
  renderActions?: (
    item: TreeViewItem<T>,
    state: TreeViewItemState,
  ) => ReactNode;

  /** Tighter rows, for side panels. */
  dense?: boolean;
  /** Disable every item, such as while a move saves. */
  disabled?: boolean;
  /** Read while an item's children load. */
  loadingLabel?: string;
  className?: string;
}

interface FlatEntry<T> {
  item: TreeViewItem<T>;
  parentId: string | null;
  level: number;
}

function itemHasChildren(item: TreeViewItem<unknown>) {
  return !!item.hasChildren || (item.children?.length ?? 0) > 0;
}

/** Every item by id, with its parent and depth. */
function indexItems<T>(items: TreeViewItem<T>[]) {
  const map = new Map<string, FlatEntry<T>>();
  const walk = (
    list: TreeViewItem<T>[],
    parentId: string | null,
    level: number,
  ) => {
    list.forEach((item) => {
      map.set(item.id, { item, parentId, level });
      if (item.children) walk(item.children, item.id, level + 1);
    });
  };
  walk(items, null, 1);
  return map;
}

/** The items a person can see, top to bottom. */
function visibleIds<T>(items: TreeViewItem<T>[], expanded: Set<string>) {
  const ids: string[] = [];
  const walk = (list: TreeViewItem<T>[]) => {
    list.forEach((item) => {
      ids.push(item.id);
      if (expanded.has(item.id) && item.children) walk(item.children);
    });
  };
  walk(items);
  return ids;
}

function useControllable<V>(
  controlled: V | undefined,
  initial: V,
  onChange?: (value: V) => void,
) {
  const [uncontrolled, setUncontrolled] = useState(initial);
  const value = controlled !== undefined ? controlled : uncontrolled;
  const setValue = useCallback(
    (next: V) => {
      if (controlled === undefined) setUncontrolled(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return [value, setValue] as const;
}

const treeStyles = css({
  margin: 0,
  padding: 0,
  listStyle: "none",
  fontFamily: "body",
  color: "fg.default",
  outline: "none",
  "& ul": { margin: 0, padding: 0, listStyle: "none" },
});

const itemStyles = css({
  outline: "none",
  // The row shows focus, not the item, which holds its whole subtree.
  "&:focus-visible > [data-tree-row]": {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "-2px",
  },
});

const rowStyles = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "1.5",
    boxSizing: "border-box",
    paddingInlineStart:
      "calc(var(--tree-depth) * var(--tree-indent) + token(spacing.1))",
    paddingInlineEnd: "1",
    borderRadius: "md",
    cursor: "pointer",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    transition: "background-color token(durations.fast) linear",
    "--tree-indent": "20px",
    _hover: { background: "overlay.hover" },
    // Rows never move; a press darkens them.
    "&:active:not(:has([data-tree-actions]:active))": {
      background: "overlay.pressed",
    },
    "[aria-expanded=true] > &": {
      "& > [data-tree-caret] svg": { rotate: "90deg" },
    },
    "[aria-selected=true] > &": {
      background: "overlay.selected",
      fontWeight: "semibold",
      "& [data-tree-icon]": { color: "fg.default" },
    },
    "[aria-disabled=true] > &": {
      cursor: "not-allowed",
      color: "fg.disabled",
      background: "transparent",
      "& [data-tree-icon]": { color: "fg.disabled" },
    },
  },
  variants: {
    dense: {
      true: {
        minHeight: "32px",
        fontSize: "sm",
        _touch: { minHeight: "touch" },
      },
      false: {
        minHeight: "40px",
        fontSize: "sm",
        _touch: { minHeight: "touch" },
      },
    },
  },
});

const caretStyles = css({
  display: "grid",
  placeItems: "center",
  flex: "none",
  width: "20px",
  height: "20px",
  marginInline: "-0.5",
  borderRadius: "xs",
  color: "fg.muted",
  "& svg": {
    width: "14px",
    height: "14px",
    transition: "rotate token(durations.normal) token(easings.out)",
    _reducedMotion: { transition: "none" },
  },
});

const iconStyles = css({
  display: "inline-flex",
  flex: "none",
  color: "fg.muted",
  "& svg": { width: "18px", height: "18px" },
});

const labelStyles = css({
  flex: "1 1 auto",
  minWidth: 0,
  paddingBlock: "1.5",
  overflowWrap: "anywhere",
  lineHeight: "snug",
});

const actionsStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "0.5",
  flex: "none",
  cursor: "default",
});

const TYPEAHEAD_RESET_MS = 500;

/**
 * An accessible tree (role="tree") for move and oracle categories, note
 * folders and other nested pickers. Data-driven: pass `items` with
 * `children`. Keys follow the WAI-ARIA tree pattern: Up and Down move,
 * Right opens or goes to the first child, Left closes or goes to the
 * parent, Home and End jump, Enter and Space select or act, * opens the
 * siblings, and typing jumps to an item by name.
 */
export function TreeView<T = unknown>(props: TreeViewProps<T>) {
  const {
    items,
    "aria-label": ariaLabel,
    selectedId: selectedIdProp,
    defaultSelectedId = null,
    onSelectedChange,
    expandedIds: expandedIdsProp,
    defaultExpandedIds = [],
    onExpandedChange,
    onItemActivate,
    onLoadChildren,
    renderLabel,
    renderActions,
    dense = false,
    disabled: treeDisabled = false,
    loadingLabel = "Loading",
    className,
  } = withLayoutProps(props);

  const selectionMode =
    selectedIdProp !== undefined || onSelectedChange !== undefined;

  const [selectedId, setSelectedId] = useState<string | null>(
    defaultSelectedId,
  );
  const currentSelectedId =
    selectedIdProp !== undefined ? selectedIdProp : selectedId;

  const [expandedList, setExpandedList] = useControllable<string[]>(
    expandedIdsProp,
    defaultExpandedIds,
    onExpandedChange,
  );
  const expanded = useMemo(() => new Set(expandedList), [expandedList]);

  const index = useMemo(() => indexItems(items), [items]);
  const visible = useMemo(() => visibleIds(items, expanded), [items, expanded]);

  // The roving tab stop: the focused item, else the selected, else the first.
  const [focusedIdState, setFocusedId] = useState<string | null>(null);
  const focusedId =
    focusedIdState && visible.includes(focusedIdState)
      ? focusedIdState
      : currentSelectedId && visible.includes(currentSelectedId)
        ? currentSelectedId
        : (visible[0] ?? null);

  const elements = useRef(new Map<string, HTMLLIElement>());
  const pendingFocus = useRef<string | null>(null);
  useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    const element = elements.current.get(id);
    if (element) {
      pendingFocus.current = null;
      element.focus();
    }
  });

  // Row actions are reached with Tab only from the focused row, so Tab
  // leaves the tree instead of walking every row's buttons. They stay
  // clickable everywhere.
  const treeRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    treeRef.current
      ?.querySelectorAll<HTMLElement>("[data-tree-actions]")
      .forEach((actions) => {
        const active = actions.hasAttribute("data-tree-actions-active");
        actions
          .querySelectorAll<HTMLElement>(
            "button, a[href], input, select, textarea, [tabindex]",
          )
          .forEach((control) => {
            control.tabIndex = active ? 0 : -1;
          });
      });
  });

  const isDisabled = (item: TreeViewItem<T>) => treeDisabled || !!item.disabled;

  const setExpanded = (id: string, open: boolean) => {
    if (expanded.has(id) === open) return;
    const entry = index.get(id);
    if (open && entry && !entry.item.children && entry.item.hasChildren) {
      void onLoadChildren?.(entry.item);
    }
    setExpandedList(
      open ? [...expandedList, id] : expandedList.filter((x) => x !== id),
    );
  };

  const moveFocus = (id: string | undefined) => {
    if (!id) return;
    setFocusedId(id);
    pendingFocus.current = id;
    elements.current.get(id)?.focus();
  };

  const activate = (item: TreeViewItem<T>) => {
    if (isDisabled(item)) return;
    const selectable = item.selectable !== false;
    if (selectionMode && selectable) {
      if (selectedIdProp === undefined) setSelectedId(item.id);
      onSelectedChange?.(item.id, item);
    } else if (itemHasChildren(item) && (!selectionMode || !selectable)) {
      setExpanded(item.id, !expanded.has(item.id));
    }
    onItemActivate?.(item);
  };

  // Type-ahead: letters typed in quick succession find the next match.
  const typed = useRef("");
  const typedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeAhead = (character: string, fromId: string) => {
    typed.current += character.toLowerCase();
    if (typedTimer.current) clearTimeout(typedTimer.current);
    typedTimer.current = setTimeout(() => {
      typed.current = "";
    }, TYPEAHEAD_RESET_MS);
    const query = typed.current;
    const start = visible.indexOf(fromId);
    // A repeated single letter cycles; a word searches from the current item.
    const offset = query.length === 1 ? 1 : 0;
    for (let step = 0; step < visible.length; step++) {
      const id = visible[(start + offset + step) % visible.length];
      const label = index.get(id)?.item.label.toLowerCase() ?? "";
      if (label.startsWith(query)) {
        moveFocus(id);
        return;
      }
    }
  };
  useEffect(
    () => () => {
      if (typedTimer.current) clearTimeout(typedTimer.current);
    },
    [],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const target = event.target as HTMLElement;
    // Keys in an action button, or any other control, are its own.
    if (target.getAttribute("role") !== "treeitem") return;
    const id = target.dataset.treeId;
    const entry = id ? index.get(id) : undefined;
    if (!id || !entry) return;
    const { item } = entry;
    const position = visible.indexOf(id);
    const open = expanded.has(id);
    const parent = itemHasChildren(item);

    if (event.altKey || event.ctrlKey || event.metaKey) return;

    switch (event.key) {
      case "ArrowDown":
        moveFocus(visible[position + 1]);
        break;
      case "ArrowUp":
        moveFocus(visible[position - 1]);
        break;
      case "ArrowRight":
        if (parent && !open) {
          if (!isDisabled(item)) setExpanded(id, true);
        } else if (parent && open && item.children?.length) {
          moveFocus(item.children[0].id);
        }
        break;
      case "ArrowLeft":
        if (parent && open) {
          setExpanded(id, false);
        } else if (entry.parentId) {
          moveFocus(entry.parentId);
        }
        break;
      case "Home":
        moveFocus(visible[0]);
        break;
      case "End":
        moveFocus(visible[visible.length - 1]);
        break;
      case "Enter":
      case " ":
        activate(item);
        break;
      case "*": {
        const siblings = entry.parentId
          ? (index.get(entry.parentId)?.item.children ?? [])
          : items;
        const toOpen = siblings.filter(
          (sibling) =>
            itemHasChildren(sibling) &&
            !isDisabled(sibling) &&
            !expanded.has(sibling.id),
        );
        toOpen.forEach((sibling) => {
          if (!sibling.children && sibling.hasChildren) {
            void onLoadChildren?.(sibling);
          }
        });
        if (toOpen.length) {
          setExpandedList([...expandedList, ...toOpen.map((s) => s.id)]);
        }
        break;
      }
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          typeAhead(event.key, id);
          break;
        }
        return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  const onFocus = (event: FocusEvent<HTMLUListElement>) => {
    const treeItem = (event.target as HTMLElement).closest<HTMLElement>(
      "[role=treeitem]",
    );
    const id = treeItem?.dataset.treeId;
    if (id && id !== focusedIdState) setFocusedId(id);
  };

  const renderItems = (list: TreeViewItem<T>[], level: number): ReactNode =>
    list.map((item, position) => {
      const hasChildren = itemHasChildren(item);
      const isExpanded = hasChildren && expanded.has(item.id);
      const loading = isExpanded && !item.children && !!item.hasChildren;
      const disabled = isDisabled(item);
      const selected = selectionMode && item.id === currentSelectedId;
      const focused = item.id === focusedId;
      const state: TreeViewItemState = {
        level,
        expanded: isExpanded,
        selected,
        focused,
        disabled,
        hasChildren,
        loading,
      };
      const actions = renderActions?.(item, state);

      const onRowClick = (event: MouseEvent<HTMLDivElement>) => {
        if ((event.target as HTMLElement).closest("[data-tree-actions]")) {
          return;
        }
        if ((event.target as HTMLElement).closest("[data-tree-caret]")) {
          if (!disabled) setExpanded(item.id, !isExpanded);
          return;
        }
        activate(item);
      };

      return (
        <li
          key={item.id}
          ref={(element) => {
            if (element) elements.current.set(item.id, element);
            else elements.current.delete(item.id);
          }}
          role="treeitem"
          data-tree-id={item.id}
          aria-level={level}
          aria-setsize={list.length}
          aria-posinset={position + 1}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-selected={
            selectionMode && item.selectable !== false ? selected : undefined
          }
          aria-disabled={disabled || undefined}
          aria-busy={loading || undefined}
          tabIndex={focused ? 0 : -1}
          className={itemStyles}
        >
          <div
            data-tree-row=""
            className={rowStyles({ dense })}
            style={{ "--tree-depth": level - 1 } as CSSProperties}
            onClick={onRowClick}
          >
            <span
              data-tree-caret={hasChildren || undefined}
              className={caretStyles}
            >
              {loading ? (
                <Spinner />
              ) : hasChildren ? (
                <CaretRight weight="bold" aria-hidden />
              ) : null}
            </span>
            {item.icon && (
              <span data-tree-icon="" className={iconStyles} aria-hidden>
                {item.icon}
              </span>
            )}
            <span className={labelStyles}>
              {renderLabel ? renderLabel(item, state) : item.label}
            </span>
            {actions && (
              <span
                data-tree-actions=""
                data-tree-actions-active={focused || undefined}
                className={actionsStyles}
              >
                {actions}
              </span>
            )}
          </div>
          {isExpanded && item.children && item.children.length > 0 && (
            <ul role="group">{renderItems(item.children, level + 1)}</ul>
          )}
          {loading && (
            <VisuallyHidden role="status">{loadingLabel}</VisuallyHidden>
          )}
        </li>
      );
    });

  return (
    <ul
      ref={treeRef}
      role="tree"
      aria-label={ariaLabel}
      className={cx(treeStyles, className)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      {renderItems(items, 1)}
    </ul>
  );
}
