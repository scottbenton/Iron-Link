import type { Datasworn } from "@datasworn-community/core";

import { Button } from "ui/components/Button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "ui/components/Collapsible";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "ui/components/List";
import { Text } from "ui/components/Text";
import { VisuallyHidden } from "ui/components/VisuallyHidden";

import { css } from "styled-system/css";

import { HighlightedText } from "./HighlightedText";
import {
  AssetPickerGroup,
  searchLine,
  summarizeAsset,
} from "./assetPickerSearch";
import { AssetPickerStrings } from "./assetPickerStrings";

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

const sourceStyles = css({
  paddingInline: "3",
  paddingBlockStart: "3",
  paddingBlockEnd: "1",
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

export interface AssetPickerGroupsProps {
  /** The groups to list, already filtered by the search. */
  groups: AssetPickerGroup[];
  /** The search, lowercase and trimmed; empty when not searching. */
  query: string;
  isOpen: (group: AssetPickerGroup) => boolean;
  onOpenChange: (group: AssetPickerGroup, open: boolean) => void;
  /** The asset whose card is showing beside the list, if any. */
  currentId?: string;
  onPick: (asset: Datasworn.Asset) => void;
  onAdd: (asset: Datasworn.Asset) => void;
  strings: AssetPickerStrings;
}

/** The asset types as collapsible groups, each listing its assets. */
export function AssetPickerGroups(props: AssetPickerGroupsProps) {
  const { groups, query, isOpen, onOpenChange, currentId, onPick, onAdd } =
    props;
  const { strings } = props;

  const sources = new Set(groups.map((group) => group.source ?? ""));
  const bySource = sources.size > 1;
  const GroupHeading = bySource ? "h4" : "h3";

  return (
    <ul className={groupsStyles}>
      {groups.map((group, index) => {
        const firstOfSource =
          bySource && group.source !== groups[index - 1]?.source;
        return (
          <li key={group.id}>
            {firstOfSource && (
              <Text
                as="h3"
                variant="label"
                color="muted"
                className={sourceStyles}
              >
                {group.source}
              </Text>
            )}
            <Collapsible
              open={isOpen(group)}
              onOpenChange={(open) => onOpenChange(group, open)}
              disabled={!!query}
            >
              <GroupHeading className={groupHeadStyles}>
                <CollapsibleTrigger className={groupTriggerStyles}>
                  {group.name}
                  <span data-count="" aria-hidden>
                    {group.assets.length}
                  </span>
                  <VisuallyHidden>
                    , {strings.assetCount(group.assets.length)}
                  </VisuallyHidden>
                </CollapsibleTrigger>
              </GroupHeading>
              <CollapsiblePanel>
                <List
                  dense
                  aria-label={group.name}
                  className={css({ paddingBlock: "1" })}
                >
                  {group.assets.map((asset) => {
                    const current = asset._id === currentId;
                    return (
                      <ListItem key={asset._id} className={rowStyles}>
                        <ListItemButton
                          selected={current}
                          aria-current={current || undefined}
                          onClick={() => onPick(asset)}
                        >
                          <ListItemText
                            primary={
                              <HighlightedText
                                text={asset.name}
                                query={query}
                              />
                            }
                            secondary={
                              query ? (
                                <HighlightedText
                                  text={searchLine(asset, query)}
                                  query={query}
                                />
                              ) : (
                                summarizeAsset(asset)
                              )
                            }
                            truncate
                          />
                        </ListItemButton>
                        <Button
                          size="sm"
                          css={{ flex: "none" }}
                          aria-label={strings.addAsset(asset.name)}
                          onClick={() => onAdd(asset)}
                        >
                          {strings.add}
                        </Button>
                      </ListItem>
                    );
                  })}
                </List>
              </CollapsiblePanel>
            </Collapsible>
          </li>
        );
      })}
    </ul>
  );
}
