import {
  BookOpen,
  DiceFive,
  Folder,
  FolderOpen,
  Lightning,
  Planet,
} from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Grid, Stack } from "ui/primitives";

import { css } from "styled-system/css";

import { starforgedRules } from "../../stories/fixtures/datasworn";
import { IconButton } from "../IconButton";
import { Text } from "../Text";
import { TreeView, TreeViewItem } from "./TreeView";

// The rules JSON is loose: a collection has `contents` and maybe nested
// `collections`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;

const moveTree: TreeViewItem[] = Object.entries(
  starforgedRules.moves as Record<string, Loose>,
).map(([key, category]) => ({
  id: `moves/${key}`,
  label: category.name,
  selectable: false,
  children: Object.entries(category.contents as Record<string, Loose>).map(
    ([moveKey, move]) => ({
      id: `moves/${key}/${moveKey}`,
      label: move.name,
      icon: <Lightning />,
    }),
  ),
}));

function oracleItems(prefix: string, collection: Loose): TreeViewItem[] {
  const groups = Object.entries(
    (collection.collections ?? {}) as Record<string, Loose>,
  ).map(([key, child]) => ({
    id: `${prefix}/${key}`,
    label: child.name as string,
    selectable: false,
    children: oracleItems(`${prefix}/${key}`, child),
  }));
  const tables = Object.entries(
    (collection.contents ?? {}) as Record<string, Loose>,
  ).map(([key, table]) => ({
    id: `${prefix}/${key}`,
    label: table.name as string,
  }));
  return [...tables, ...groups];
}

const oracleTree: TreeViewItem[] = Object.entries(
  starforgedRules.oracles as Record<string, Loose>,
).map(([key, collection]) => ({
  id: `oracles/${key}`,
  label: collection.name,
  selectable: false,
  children: oracleItems(`oracles/${key}`, collection),
}));

const frame = css({
  width: "100%",
  maxWidth: "360px",
  maxHeight: "480px",
  overflowY: "auto",
  padding: "1",
  border: "1px solid token(colors.border.default)",
  borderRadius: "lg",
  background: "bg.surface",
  boxSizing: "border-box",
});

const meta: Meta<typeof TreeView> = {
  title: "Components/TreeView",
  component: TreeView,
};

export default meta;
type Story = StoryObj<typeof TreeView>;

/** Moves open from their category; each move opens its dialog. */
export const MoveTree: Story = {
  render: function Render() {
    const [opened, setOpened] = useState<string | null>(null);
    return (
      <Stack gap="3">
        <div className={frame}>
          <TreeView
            aria-label="Moves"
            items={moveTree}
            defaultExpandedIds={["moves/adventure"]}
            onItemActivate={(item) => {
              if (!item.children) setOpened(item.label);
            }}
          />
        </div>
        <Text variant="bodySm" color="muted">
          Opened: {opened ?? "nothing yet"}
        </Text>
      </Stack>
    );
  },
};

/**
 * An oracle picker: tables are selectable, collections only open, and each
 * table has a Roll action reached with Tab from its row.
 */
export const OracleTree: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<string | null>(
      "oracles/core/action",
    );
    const [rolled, setRolled] = useState<string | null>(null);
    return (
      <Stack gap="3">
        <div className={frame}>
          <TreeView
            aria-label="Oracles"
            items={oracleTree}
            dense
            selectedId={selected}
            onSelectedChange={(id) => setSelected(id)}
            defaultExpandedIds={["oracles/core", "oracles/planet"]}
            renderActions={(item) =>
              item.children ? null : (
                <IconButton
                  size="sm"
                  label={`Roll ${item.label}`}
                  onClick={() => setRolled(item.label)}
                >
                  <DiceFive />
                </IconButton>
              )
            }
          />
        </div>
        <Text variant="bodySm" color="muted">
          Selected: {selected ?? "none"}. Rolled: {rolled ?? "none"}.
        </Text>
      </Stack>
    );
  },
};

const folders: TreeViewItem[] = [
  {
    id: "root",
    label: "Notes",
    icon: <BookOpen />,
    children: [
      {
        id: "sessions",
        label: "Session Logs",
        icon: <Folder />,
        children: [
          { id: "s11", label: "Session 11", icon: <Folder /> },
          { id: "s12", label: "Session 12", icon: <Folder /> },
        ],
      },
      { id: "npcs", label: "NPCs", icon: <Folder /> },
      {
        id: "locations",
        label: "Locations",
        icon: <Planet />,
        hasChildren: true,
      },
      { id: "vows", label: "Vows", icon: <Folder />, disabled: true },
    ],
  },
];

/**
 * The Move dialog's destination picker: a disabled folder (the note's own),
 * and Locations, whose children load when it opens.
 */
export const LazyFolders: Story = {
  render: function Render() {
    const [items, setItems] = useState(folders);
    const [selected, setSelected] = useState<string | null>(null);
    const load = (item: TreeViewItem) =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          setItems((current) =>
            current.map((root) => ({
              ...root,
              children: root.children?.map((child) =>
                child.id === item.id
                  ? {
                      ...child,
                      children: [
                        {
                          id: "derelict",
                          label: "The Derelict Ship",
                          icon: <FolderOpen />,
                        },
                        {
                          id: "bleak",
                          label: "Bleakhold Station",
                          icon: <FolderOpen />,
                        },
                      ],
                    }
                  : child,
              ),
            })),
          );
          resolve();
        }, 1200);
      });
    return (
      <Grid gap="3" maxWidth="360px">
        <div className={frame}>
          <TreeView
            aria-label="Destination"
            items={items}
            selectedId={selected}
            onSelectedChange={(id) => setSelected(id)}
            defaultExpandedIds={["root"]}
            onLoadChildren={load}
          />
        </div>
        <Text variant="bodySm" color="muted">
          Move to: {selected ?? "choose a folder"}
        </Text>
      </Grid>
    );
  },
};
