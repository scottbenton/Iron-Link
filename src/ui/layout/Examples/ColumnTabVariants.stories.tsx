/**
 * The character and reference columns' own tabs in each section tab
 * variant, with the same content, so the tab rows can be compared where
 * they live: under the column's header, on the sidebar's muted surface.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CSSProperties } from "react";

import { css } from "styled-system/css";
import { Grid, Stack } from "styled-system/jsx";

import { SectionTabsVariant } from "../../components/Tabs";
import { Text } from "../../components/Text";
import { Sidebar } from "../Sidebar";
import {
  CharacterColumn,
  CharacterColumnActions,
  NotesColumn,
  ReferenceColumn,
} from "./GamePageColumns";

interface Args {
  variant: SectionTabsVariant;
}

const meta: Meta<Args> = {
  title: "Layout/Examples/Column tab variants",
  parameters: { layout: "padded" },
  args: { variant: "well" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: [
        "segmented",
        "chips",
        "underline",
        "band",
        "accent",
        "pills",
        "well",
      ],
    },
  },
};

export default meta;
type Story = StoryObj<Args>;

const notes: Record<SectionTabsVariant, string> = {
  segmented: "Segmented: the sunken well used today.",
  chips: "Chips: the current tab a raised card, like the open note.",
  underline: "Underline: body colour on a hairline, like the page tabs.",
  band: "Band: a surface strip across the column, accent bar.",
  accent: "Accent: heading-face labels, the current one in the accent.",
  pills: "Pills: rounded, the current one tinted with the accent.",
  well: "Chips in a well (recommended): the note tabs' chips in a canvas band, edge to edge.",
};

const columnFrame = css({
  display: "flex",
  height: "var(--column-height)",
  border: "1px solid token(colors.border.default)",
  borderRadius: "md",
  overflow: "hidden",
});

/** The two columns as the game page shows them, in one variant. */
function ColumnPair(props: { variant: SectionTabsVariant }) {
  const { variant } = props;
  return (
    <Grid gridTemplateColumns="repeat(2, 340px)" gap="4">
      <div className={columnFrame}>
        <Sidebar
          panels={[
            {
              id: "character",
              title: "Character",
              actions: <CharacterColumnActions />,
              content: <CharacterColumn tabsVariant={variant} />,
            },
          ]}
          width={338}
          resizable={false}
          collapsible={false}
        />
      </div>
      <div className={columnFrame}>
        <Sidebar
          side="end"
          panels={[
            {
              id: "reference",
              title: "Reference",
              content: <ReferenceColumn tabsVariant={variant} />,
            },
          ]}
          width={338}
          resizable={false}
          collapsible={false}
        />
      </div>
    </Grid>
  );
}

const variants: SectionTabsVariant[] = [
  "well",
  "segmented",
  "underline",
  "band",
  "accent",
  "pills",
  "chips",
];

/**
 * Every variant, one row each, the character column beside the reference.
 * Try Assets or Oracles in a row: each pair keeps its own selection.
 */
export const Compare: Story = {
  render: () => (
    <Stack gap="8" style={{ "--column-height": "300px" } as CSSProperties}>
      {variants.map((variant) => (
        <Stack key={variant} gap="2">
          <Text variant="label" as="p">
            {notes[variant]}
          </Text>
          <ColumnPair variant={variant} />
        </Stack>
      ))}
    </Stack>
  ),
};

/** One variant at full height; pick it from the controls. */
export const Single: Story = {
  render: (args) => (
    <Stack gap="2" style={{ "--column-height": "680px" } as CSSProperties}>
      <Text variant="label" as="p">
        {notes[args.variant]}
      </Text>
      <ColumnPair variant={args.variant} />
    </Stack>
  ),
};

const notesFrame = css({
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  height: "var(--column-height)",
  border: "1px solid token(colors.border.default)",
  borderRadius: "md",
  overflow: "hidden",
  background: "bg.surface",
});

/**
 * The character column, the notes and the reference side by side, as on
 * the game page: the columns' chips in a well beside the note tabs' own
 * strip. Pick another variant from the controls to compare it in place.
 */
export const BesideTheNotes: Story = {
  name: "Beside the notes",
  render: (args) => (
    <Stack gap="2" style={{ "--column-height": "620px" } as CSSProperties}>
      <Text variant="label" as="p">
        {notes[args.variant]}
      </Text>
      <Grid gridTemplateColumns="340px minmax(360px, 1fr) 340px" gap="4">
        <div className={columnFrame}>
          <Sidebar
            panels={[
              {
                id: "character",
                title: "Character",
                actions: <CharacterColumnActions />,
                content: <CharacterColumn tabsVariant={args.variant} />,
              },
            ]}
            width={338}
            resizable={false}
            collapsible={false}
          />
        </div>
        <div className={notesFrame}>
          <NotesColumn />
        </div>
        <div className={columnFrame}>
          <Sidebar
            side="end"
            panels={[
              {
                id: "reference",
                title: "Reference",
                content: <ReferenceColumn tabsVariant={args.variant} />,
              },
            ]}
            width={338}
            resizable={false}
            collapsible={false}
          />
        </div>
      </Grid>
    </Stack>
  ),
};
