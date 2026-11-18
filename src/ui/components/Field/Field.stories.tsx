import { DiceFive, Note } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { css } from "styled-system/css";
import { Box, Grid, HStack, Stack } from "styled-system/jsx";

import { Combobox } from "../Combobox";
import { Select } from "../Select";
import { Text } from "../Text";
import { TextArea } from "../TextArea";
import { TextField } from "../TextField";
import { Tooltip } from "../Tooltip";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldRoot,
} from "./Field";
import { fieldIconButtonStyles } from "./fieldStyles";

const meta = {
  title: "Components/Field",
  component: Field,
  args: {
    label: "Character Name",
    description: "Shown on your character sheet and in the game log.",
    children: null,
  },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md"] } },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Field labels any control: here a TextField that would label itself. Help
 * text sits under the label, the error under the control; the control reads
 * both as its description.
 */
export const Playground: Story = {
  args: { required: true },
  render: (args) => (
    <Stack maxWidth="360px">
      <Field {...args}>
        <TextField placeholder="Kayu Stonehand" />
      </Field>
    </Stack>
  ),
};

/** The parts, for a custom control: label, control, help, then error. */
export const Parts: Story = {
  render: () => (
    <Stack maxWidth="360px">
      <FieldRoot invalid>
        <FieldLabel required>Pronouns</FieldLabel>
        <TextField />
        <FieldDescription>For example: she/her, they/them.</FieldDescription>
        <FieldError>Enter pronouns, or leave the field blank.</FieldError>
      </FieldRoot>
    </Stack>
  ),
};

/**
 * Help sits under the control, so fields side by side line up whether or not
 * they have any.
 */
export const SideBySide: Story = {
  render: () => (
    <Grid columns={2} gap="4" maxWidth="560px">
      <TextField label="Character Name" description="Shown to everyone." />
      <TextField label="Pronouns" />
    </Grid>
  ),
};

export const Invalid: Story = {
  args: {
    label: "Game Name",
    description: "Players see it when they join.",
    error: "Give your game a name before you create it.",
    required: true,
  },
  render: (args) => (
    <Stack maxWidth="360px">
      <Field {...args}>
        <TextField />
      </Field>
    </Stack>
  ),
};

const populations = [
  "Few",
  "Dozens",
  "Hundreds",
  "Thousands",
  "Tens of thousands",
].map((label) => ({ value: label.toLowerCase(), label }));

const authorities = [
  "None or lawless",
  "Ineffectual",
  "Tolerant",
  "Fair",
  "Unyielding",
  "Corrupt",
  "Oppressive",
].map((label) => ({ value: label.toLowerCase(), label }));

const projects = [
  "Agriculture",
  "Archeology",
  "Black market",
  "Defense",
  "Energy",
  "Exploration",
  "Manufacturing",
  "Medical",
  "Mining",
  "Salvage",
  "Shipbuilding",
  "Trade",
].map((label) => ({ value: label.toLowerCase(), label }));

const troubles = [
  "Dangerous discovery",
  "Disease or sickness",
  "Failing technology",
  "Feuding factions",
  "Raiders prey on the weak",
  "Supply shortage",
];

const panelStyles = css({
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "lg",
  background: "bg.muted",
  maxWidth: "640px",
  // Each column is a container, as the app sizes entry columns.
  containerType: "inline-size",
});

const panelHeadStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  paddingInline: "4",
  paddingBlock: "3",
  color: "fg.muted",
  "& > svg": { width: "16px", height: "16px" },
});

const fullRow = css({ gridColumn: "1 / -1" });

function RollButton(props: { label: string; onRoll: () => void }) {
  const { label, onRoll } = props;
  return (
    <Tooltip title={label}>
      <button
        type="button"
        className={fieldIconButtonStyles}
        aria-label={label}
        onClick={onRoll}
      >
        <DiceFive weight="bold" />
      </button>
    </Tooltip>
  );
}

function SettlementDetails(props: { variant: "outline" | "quiet" }) {
  const { variant } = props;
  const [trouble, setTrouble] = useState("Supply shortage");
  const [firstLook, setFirstLook] = useState("");
  const roll = (from: string[]) =>
    from[Math.floor(Math.random() * from.length)];

  return (
    <section className={panelStyles} aria-labelledby={`details-${variant}`}>
      <div className={panelHeadStyles}>
        <Note aria-hidden />
        <Text variant="eyebrow" as="h2" id={`details-${variant}`}>
          Details
        </Text>
      </div>
      <Grid
        columns={{ base: 1, sm: 2 }}
        columnGap="6"
        rowGap="3"
        paddingInline="4"
        paddingBottom="4"
      >
        <Select
          size="sm"
          variant={variant}
          label="Population"
          placeholder="Empty"
          options={populations}
          defaultValue="hundreds"
        />
        <Select
          size="sm"
          variant={variant}
          label="Authority"
          placeholder="Empty"
          options={authorities}
          description="Who keeps order, and how."
        />
        <TextField
          size="sm"
          variant={variant}
          label="First look"
          placeholder="Empty"
          value={firstLook}
          onValueChange={setFirstLook}
          endAdornment={
            <RollButton
              label="Roll First look"
              onRoll={() =>
                setFirstLook(
                  roll([
                    "Built into a cliff face",
                    "Ringed by a stockade",
                    "Smoke from many forges",
                    "Stilt houses over a marsh",
                  ]),
                )
              }
            />
          }
        />
        <TextField
          size="sm"
          variant={variant}
          label="Trouble"
          placeholder="Empty"
          value={trouble}
          onValueChange={setTrouble}
          endAdornment={
            <RollButton
              label="Roll Trouble"
              onRoll={() => setTrouble(roll(troubles))}
            />
          }
        />
        <Combobox
          className={fullRow}
          size="sm"
          variant={variant}
          multiple
          freeText
          label="Projects"
          placeholder="Add a project"
          options={projects}
          defaultValue={["mining", "trade", "defense"]}
          hideSelected
        />
        <TextArea
          className={fullRow}
          size="sm"
          variant={variant}
          label="Guide's note"
          placeholder="Empty"
          minRows={2}
          defaultValue="The reeve hoards the winter stores. The Iron Wardens suspect it but have no proof."
        />
      </Grid>
    </section>
  );
}

/**
 * Compact (`size="sm"`), quiet (`variant="quiet"`) fields in a world entry's
 * Details panel, two columns wide: values read as text until hovered or
 * focused, and each field's text lines up with its label.
 */
export const WorldEntryFields: Story = {
  name: "World entry fields",
  render: () => <SettlementDetails variant="quiet" />,
};

/** The same panel with outlined compact fields, for a form-like entry. */
export const WorldEntryFieldsOutlined: Story = {
  name: "World entry fields, outlined",
  render: () => <SettlementDetails variant="outline" />,
};

/** Default and compact sizes side by side, with help and an error. */
export const Sizes: Story = {
  render: () => (
    <HStack alignItems="flex-start" gap="8" flexWrap="wrap">
      {(["md", "sm"] as const).map((size) => (
        <Box key={size} width="280px">
          <Stack gap="4">
            <TextField
              size={size}
              label="Character Name"
              description="Shown on your character sheet."
              defaultValue="Kayu Stonehand"
            />
            <Select
              size={size}
              label="Ruleset"
              options={[
                { value: "ironsworn", label: "Ironsworn" },
                { value: "starforged", label: "Starforged" },
              ]}
              defaultValue="ironsworn"
              error="Starforged assets are not loaded."
            />
          </Stack>
        </Box>
      ))}
    </HStack>
  ),
};
