import type { Datasworn } from "@datasworn-community/core";
import { BookOpenIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useMemo, useState } from "react";

import { Flex, Stack } from "ui/primitives";

import { css } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { SearchField } from "../../components/SearchField";
import { Text } from "../../components/Text";
import { classicRules } from "../../docs/fixtures/datasworn";
import { MoveListItem } from "../../game/MoveListItem";
import { ReferenceCategory } from "../../game/ReferenceCategory";
import { Sidebar } from "../../layout/Sidebar";
import { usePreviewRolls } from "./previewRolls";

interface MoveCategory {
  _id: string;
  name: string;
  contents: Record<string, Datasworn.AnyMove>;
}

const categories = Object.values(
  classicRules.moves as Record<string, MoveCategory>,
);

const moveCountLabel = (count: number) =>
  count === 1 ? "1 move" : `${count} moves`;

/**
 * The app's search: a category whose name matches shows all its moves,
 * otherwise only the moves whose names match.
 */
function filterCategories(search: string) {
  const query = search.trim().toLocaleLowerCase();
  if (!query)
    return categories.map((c) => ({ ...c, moves: Object.values(c.contents) }));
  return categories
    .map((category) => {
      const moves = Object.values(category.contents);
      const matched = category.name.toLocaleLowerCase().includes(query)
        ? moves
        : moves.filter((move) => move.name.toLocaleLowerCase().includes(query));
      return { ...category, moves: matched };
    })
    .filter((category) => category.moves.length > 0);
}

const frame = css({
  display: "flex",
  height: "100dvh",
  minHeight: "480px",
  background: "bg.surface",
});

const searchRow = css({
  position: "sticky",
  top: 0,
  zIndex: 1,
  paddingInline: "4",
  paddingBlock: "3",
  background: "bg.muted",
});

const listStyles = css({
  display: "grid",
  gap: "2",
  minWidth: 0,
  paddingInline: "4",
  paddingBlockEnd: "6",
});

function MovesPanel() {
  const [search, setSearch] = useState("");
  const { roll, moveRollOptions } = usePreviewRolls();
  const visible = useMemo(() => filterCategories(search), [search]);
  const total = visible.reduce((n, c) => n + c.moves.length, 0);
  const searching = search.trim() !== "";

  const announce = useAnnounce();
  useEffect(() => {
    if (!searching) return;
    const id = setTimeout(
      () => announce(total === 1 ? "1 move found" : `${total} moves found`),
      400,
    );
    return () => clearTimeout(id);
  }, [announce, searching, total]);

  return (
    <Stack gap="0" minWidth="0">
      <div className={searchRow}>
        <SearchField
          label="Search moves"
          placeholder="Search moves"
          value={search}
          onValueChange={setSearch}
        />
      </div>
      <div className={listStyles}>
        {visible.map((category) => (
          <ReferenceCategory
            // A search remounts the categories so matches open.
            key={`${category._id}-${searching}`}
            title={category.name}
            count={category.moves.length}
            countLabel={moveCountLabel}
            defaultOpen={searching || category._id.endsWith("/adventure")}
          >
            {category.moves.map((move) => (
              <MoveListItem
                key={move._id}
                move={move}
                moveCardProps={{
                  rollOptions: moveRollOptions(move),
                  onRoll: (option) =>
                    roll(option.label, option.value ?? 0, move.name),
                }}
              />
            ))}
          </ReferenceCategory>
        ))}
        {visible.length === 0 && (
          <Text color="muted" css={{ paddingBlock: "4" }}>
            No moves match “{search.trim()}”.
          </Text>
        )}
      </div>
    </Stack>
  );
}

function MovesSidebarPreview() {
  const [width, setWidth] = useState(380);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Flex className={frame}>
      <Sidebar
        panels={[
          {
            id: "moves",
            title: "Moves",
            icon: <BookOpenIcon />,
            content: <MovesPanel />,
          },
        ]}
        side="start"
        resizable
        collapsible
        minWidth={300}
        maxWidth={560}
        width={width}
        onWidthChange={setWidth}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />
      <Stack flex="1" minWidth="0" padding="6" gap="2">
        <Text variant="h3" as="p">
          Every Ironsworn move, one search away
        </Text>
        <Text color="muted" css={{ maxWidth: "52ch" }}>
          Search by move or category name, open a move to read it, and roll
          straight from its card. Drag the sidebar's edge to resize it.
        </Text>
      </Stack>
    </Flex>
  );
}

const meta = {
  title: "Previews/Moves Sidebar",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Ironsworn moves, from Datasworn, in the game page's sidebar. */
export const IronswornMoves: Story = {
  name: "Ironsworn moves",
  render: () => <MovesSidebarPreview />,
};
