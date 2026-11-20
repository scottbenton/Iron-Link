import type { Datasworn } from "@datasworn-community/core";
import { CaretLeft } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";

import { Button } from "ui/components/Button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "ui/components/Collapsible";
import { Dialog, DialogHeader } from "ui/components/Dialog";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "ui/components/List";
import { SearchField } from "ui/components/SearchField";
import { Text } from "ui/components/Text";
import { VisuallyHidden } from "ui/components/VisuallyHidden";
import { Stack } from "ui/primitives";

import { css } from "styled-system/css";

import {
  classicRules,
  starforgedRules,
} from "../../../docs/fixtures/datasworn";
import { AssetCard } from "../../AssetCard";

/**
 * Option D from the picker prototypes: one list of collapsible groups, one
 * per asset type, like the reference's categories, with the chosen asset's
 * card beside it. Below 640px of dialog the card opens in place of the list
 * instead, with a Back button and Add pinned to the bottom. Every group starts
 * closed and nothing is chosen until you pick an asset.
 *
 * This is a story built from library parts, not a component yet: once the
 * design settles, the app's picker is rebuilt from the same parts.
 */
const meta: Meta = {
  title: "Game/AssetPickerDialog",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

interface PickerGroup {
  id: string;
  name: string;
  assets: Datasworn.Asset[];
}

function getGroups(rules: {
  assets: Record<string, Datasworn.AssetCollection>;
}): PickerGroup[] {
  return Object.values(rules.assets).map((collection) => ({
    id: collection._id,
    name: collection.name,
    assets: Object.values(collection.contents ?? {}),
  }));
}

/** Markdown links, emphasis and line breaks, read as plain text. */
function plain(markdown: string) {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The line under an asset's name: its requirement, else its first ability. */
function summarize(asset: Datasworn.Asset) {
  const first = asset.abilities[0]?.text ?? "";
  return plain(asset.requirement ?? first);
}

function matches(asset: Datasworn.Asset, query: string) {
  if (!query) return true;
  return (
    asset.name.toLowerCase().includes(query) ||
    asset.abilities.some((ability) =>
      plain(ability.text).toLowerCase().includes(query),
    )
  );
}

/** How much of an ability to keep before a match, so it shows in the row. */
const EXCERPT_LEAD = 24;

/**
 * The line under an asset's name while searching. A name match keeps the
 * usual line; an ability match shows that ability from just before the
 * match, so the match is in view rather than cut off at the end of the row.
 */
function searchLine(asset: Datasworn.Asset, query: string) {
  if (asset.name.toLowerCase().includes(query)) return summarize(asset);
  for (const ability of asset.abilities) {
    const text = plain(ability.text);
    const index = text.toLowerCase().indexOf(query);
    if (index === -1) continue;
    if (index <= EXCERPT_LEAD) return text;
    // Start at a word boundary a little before the match.
    const space = text.indexOf(" ", index - EXCERPT_LEAD);
    const start = space === -1 || space >= index ? index : space + 1;
    return `…${text.slice(start)}`;
  }
  return summarize(asset);
}

const markStyles = css({
  background: "accent.soft",
  color: "fg.default",
  fontWeight: "semibold",
  borderRadius: "xs",
});

/** The text with each place it contains the query marked. */
function highlight(text: string, query: string): ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const parts: ReactNode[] = [];
  let from = 0;
  let index = lower.indexOf(query);
  while (index !== -1) {
    if (index > from) parts.push(text.slice(from, index));
    parts.push(
      <mark key={index} className={markStyles}>
        {text.slice(index, index + query.length)}
      </mark>,
    );
    from = index + query.length;
    index = lower.indexOf(query, from);
  }
  if (from === 0) return text;
  if (from < text.length) parts.push(text.slice(from));
  return parts;
}

function countAssets(count: number) {
  return count === 1 ? "1 asset" : `${count} assets`;
}

/** The width of an element, kept current. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

// The two panes: the groups and the card. The dialog keeps the same height
// whichever group is open, so the panes scroll instead of the dialog
// changing size under the pointer.
const popupStyles = css({
  height: "min(720px, calc(100dvh - 48px))",
});

const searchStyles = css({
  flex: "none",
  paddingInline: "5",
  paddingBlock: "3",
  borderBottom: "1px solid token(colors.border.subtle)",
});

// The dialog's width (DIALOG_WIDTH) leaves the card column about 520px, so
// the card reads as a card rather than a full-width panel.
const DIALOG_WIDTH = 900;

const bodyStyles = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  flex: "1 1 auto",
  minHeight: 0,
  overflow: "hidden",
  "&[data-wide]": {
    gridTemplateColumns: "minmax(260px, 340px) minmax(0, 1fr)",
  },
});

const paneStyles = css({
  minWidth: 0,
  minHeight: 0,
  overflowY: "auto",
  overscrollBehavior: "contain",
});

const detailStyles = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 520px)",
  alignContent: "start",
  gap: "3",
  padding: "4",
  borderInlineStart: "1px solid token(colors.border.subtle)",
});

// A grid's implicit column is sized to its widest row's unwrapped text, so
// the column is pinned to the pane and the rows' text truncates instead.
const groupsStyles = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "1",
  margin: 0,
  padding: "2",
  listStyle: "none",
});

const groupHeadStyles = css({
  position: "sticky",
  top: 0,
  zIndex: 1,
  margin: 0,
  background: "bg.surface",
  paddingBlockStart: "0.5",
});

const groupTriggerStyles = css({
  display: "flex",
  width: "100%",
  marginInline: 0,
  paddingInline: "3",
  minHeight: "40px",
  borderRadius: "md",
  background: "bg.muted",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "md",
  _hover: { background: "bg.emphasized" },
  "& [data-count]": {
    marginInlineStart: "auto",
    fontFamily: "body",
    fontWeight: "normal",
    fontSize: "sm",
    color: "fg.muted",
    fontVariantNumeric: "tabular-nums",
  },
});

const rowStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
  minWidth: 0,
  paddingInlineEnd: "1.5",
});

const resultsStyles = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "0.5",
  paddingInline: "3",
  paddingBlockStart: "3",
});

const phoneDetailStyles = css({
  display: "flex",
  flexDirection: "column",
  minHeight: "100%",
});

const stickyAddStyles = css({
  position: "sticky",
  bottom: 0,
  marginBlockStart: "auto",
  padding: "3",
  paddingBlockEnd: "calc(token(spacing.3) + env(safe-area-inset-bottom, 0px))",
  background: "bg.surface",
  borderTop: "1px solid token(colors.border.subtle)",
});

interface AssetPickerProps {
  groups: PickerGroup[];
  open: boolean;
  onClose: () => void;
  onAdd: (asset: Datasworn.Asset) => void;
}

function AssetPicker(props: AssetPickerProps) {
  const { groups, open, onClose, onAdd } = props;
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [showDetail, setShowDetail] = useState(false);
  const [bodyRef, width] = useWidth();
  const wide = width === undefined || width >= 640;
  const idBase = useId();

  const search = query.trim().toLowerCase();
  const shownGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          assets: group.assets.filter((asset) => matches(asset, search)),
        }))
        .filter((group) => group.assets.length > 0),
    [groups, search],
  );
  const isOpen = (group: PickerGroup) =>
    search ? true : openGroups.includes(group.id);
  const visible = shownGroups.filter(isOpen).flatMap((group) => group.assets);
  const selected = visible.find((asset) => asset._id === selectedId);

  const pick = (asset: Datasworn.Asset) => {
    setSelectedId(asset._id);
    if (!wide) setShowDetail(true);
  };

  const add = (asset: Datasworn.Asset) => {
    onAdd(asset);
    onClose();
  };

  const groupList = (
    <>
      {search && (
        <div className={resultsStyles}>
          <Text as="h3" variant="h4">
            {visible.length === 1 ? "1 result" : `${visible.length} results`}
          </Text>
          <Text variant="caption" color="muted">
            For “{query.trim()}” across every type
          </Text>
        </div>
      )}
      {shownGroups.length === 0 ? (
        <Text variant="bodySm" color="muted" className={css({ padding: "4" })}>
          No assets match “{query.trim()}”.
        </Text>
      ) : (
        <ul className={groupsStyles}>
          {shownGroups.map((group) => (
            <li key={group.id}>
              <Collapsible
                open={isOpen(group)}
                onOpenChange={(next) =>
                  setOpenGroups((current) =>
                    next
                      ? [...current, group.id]
                      : current.filter((id) => id !== group.id),
                  )
                }
                disabled={!!search}
              >
                <h3 className={groupHeadStyles}>
                  <CollapsibleTrigger className={groupTriggerStyles}>
                    {group.name}
                    <span data-count="" aria-hidden>
                      {group.assets.length}
                    </span>
                    <VisuallyHidden>
                      , {countAssets(group.assets.length)}
                    </VisuallyHidden>
                  </CollapsibleTrigger>
                </h3>
                <CollapsiblePanel>
                  <List
                    dense
                    aria-label={group.name}
                    className={css({ paddingBlock: "1" })}
                  >
                    {group.assets.map((asset) => {
                      const current = wide && asset._id === selected?._id;
                      return (
                        <ListItem key={asset._id} className={rowStyles}>
                          <ListItemButton
                            selected={current}
                            aria-current={current || undefined}
                            onClick={() => pick(asset)}
                          >
                            <ListItemText
                              primary={highlight(asset.name, search)}
                              secondary={
                                search
                                  ? highlight(searchLine(asset, search), search)
                                  : summarize(asset)
                              }
                              truncate
                            />
                          </ListItemButton>
                          <Button
                            size="sm"
                            css={{ flex: "none" }}
                            aria-label={`Add ${asset.name}`}
                            onClick={() => add(asset)}
                          >
                            Add
                          </Button>
                        </ListItem>
                      );
                    })}
                  </List>
                </CollapsiblePanel>
              </Collapsible>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  const card = selected && (
    <AssetCard asset={selected} readOnly headingAs="h3" />
  );

  let body;
  if (!wide && showDetail && selected) {
    body = (
      <div className={paneStyles}>
        <div className={phoneDetailStyles}>
          <div className={css({ padding: "2" })}>
            <Button
              variant="text"
              startIcon={<CaretLeft weight="bold" />}
              onClick={() => setShowDetail(false)}
            >
              {search ? "Results" : "Assets"}
            </Button>
          </div>
          <div className={css({ paddingInline: "4", paddingBlockEnd: "4" })}>
            {card}
          </div>
          <div className={stickyAddStyles}>
            <Button variant="primary" fullWidth onClick={() => add(selected)}>
              Add {selected.name}
            </Button>
          </div>
        </div>
      </div>
    );
  } else {
    body = (
      <>
        <div className={paneStyles} id={`${idBase}-list`}>
          {groupList}
        </div>
        {wide && (
          <div className={`${paneStyles} ${detailStyles}`}>
            {selected ? (
              <>
                {card}
                <Stack direction="row" justifyContent="flex-end">
                  <Button variant="primary" onClick={() => add(selected)}>
                    Add {selected.name}
                  </Button>
                </Stack>
              </>
            ) : (
              <Text variant="bodySm" color="muted">
                Pick an asset to read its card.
              </Text>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={DIALOG_WIDTH}
      fullScreenOnMobile
      className={popupStyles}
    >
      <DialogHeader title="Add Asset" />
      <div className={searchStyles}>
        <SearchField
          label="Search assets"
          placeholder="Search by name or ability"
          value={query}
          onValueChange={(next) => {
            setQuery(next);
            setShowDetail(false);
          }}
        />
      </div>
      <div ref={bodyRef} className={bodyStyles} data-wide={wide || undefined}>
        {body}
      </div>
    </Dialog>
  );
}

function Demo(props: { rules: typeof starforgedRules }) {
  const groups = useMemo(() => getGroups(props.rules), [props.rules]);
  const [open, setOpen] = useState(true);
  const [added, setAdded] = useState<string>();
  return (
    <Stack gap="3" padding="6" alignItems="flex-start">
      <Button variant="primary" onClick={() => setOpen(true)}>
        Add Asset
      </Button>
      <Text variant="bodySm" color="muted" role="status">
        {added ? `Added ${added}.` : ""}
      </Text>
      <AssetPicker
        groups={groups}
        open={open}
        onClose={() => setOpen(false)}
        onAdd={(asset) => setAdded(asset.name)}
      />
    </Stack>
  );
}

/**
 * Starforged's assets. The dialog grows to 900px (less a margin on smaller
 * screens): wide enough for the groups and the card side by side, narrow
 * enough that the card stays card sized. Every group starts closed. Long
 * lines end in an ellipsis rather than widening the list. Search opens
 * every group, counts the results and marks the match in each row; when
 * only an ability matches, the row's second line shows that ability from
 * the match. Narrow the window below about 700px to see the phone layout:
 * one pane, and picking an asset opens its card with Back and an Add button
 * pinned to the bottom.
 */
export const Starforged: Story = {
  render: () => <Demo rules={starforgedRules} />,
};

/** Ironsworn's assets, with its four types. */
export const Ironsworn: Story = {
  render: () => <Demo rules={classicRules} />,
};
