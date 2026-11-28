import type { Meta, StoryObj } from "@storybook/react-vite";

import { Grid, Stack } from "ui/primitives";

import { IconButton } from "../../../components/IconButton";
import {
  DotsSixVerticalIcon,
  DotsThreeIcon,
  FileTextIcon,
  FolderIcon,
  FolderUserIcon,
} from "../../../icons";
import { NoteCard } from "../NoteCard";

const menu = (name: string) => (
  <IconButton label={`${name} actions`} size="sm">
    <DotsThreeIcon weight="bold" />
  </IconButton>
);

const meta = {
  title: "Game/NoteCard",
  component: NoteCard,
  args: {
    icon: <FolderIcon />,
    title: "Sessions",
    link: { href: "#sessions" },
  },
} satisfies Meta<typeof NoteCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A folder's sub-folders in a grid that stretches its rows. */
export const FolderGrid: Story = {
  render: () => (
    <Grid
      gap="2"
      gridTemplateColumns="repeat(auto-fill, minmax(min(100%, 200px), 1fr))"
    >
      <NoteCard
        icon={<FolderUserIcon />}
        title="Shared with the table"
        link={{ href: "#shared" }}
        action={menu("Shared with the table")}
      />
      <NoteCard
        icon={<FolderIcon />}
        title="Sessions"
        link={{ href: "#sessions" }}
        action={menu("Sessions")}
      />
      <NoteCard
        icon={<FolderIcon />}
        title="Locations"
        subtitle="12 entries"
        link={{ href: "#locations" }}
      />
    </Grid>
  ),
};

/** Notes in a folder the reader can reorder, each with its drag handle. */
export const SortableNotes: Story = {
  render: () => (
    <Stack gap="2">
      {["Session 1: The Iron Vow", "Session 2: Into the Deep Wilds"].map(
        (title) => (
          <NoteCard
            key={title}
            icon={<FileTextIcon />}
            title={title}
            link={{ href: "#note" }}
            start={
              <IconButton label={`Move ${title}`} size="sm">
                <DotsSixVerticalIcon />
              </IconButton>
            }
            action={menu(title)}
          />
        ),
      )}
    </Stack>
  ),
};
