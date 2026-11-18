import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Stack } from "styled-system/jsx";

import { Checkbox } from "./Checkbox";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  args: {
    label: "Wounded",
    description: "You are injured and suffer -1 to health.",
  },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md"] } },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Debilities: Story = {
  render: () => (
    <Stack gap="2">
      <Checkbox label="Wounded" defaultChecked />
      <Checkbox label="Shaken" />
      <Checkbox label="Unprepared" />
      <Checkbox label="Encumbered" disabled />
      <Checkbox
        label="Maimed"
        description="Permanent. Your health, spirit and supply can't be raised above 4."
        disabled
        defaultChecked
      />
    </Stack>
  ),
};

/**
 * Iron Link uses checkboxes, never switches, for on/off settings in forms.
 * A setting that used a Switch takes a Checkbox with a description.
 */
export const SettingsInsteadOfSwitch: Story = {
  render: function Render() {
    const [guided, setGuided] = useState(true);
    return (
      <Stack gap="3" maxWidth="420px">
        <Checkbox
          label="Show roll cards in dialogs"
          description="Recent rolls appear above the dialog's content."
          defaultChecked
        />
        <Checkbox
          label="Allow players to view Guide notes"
          checked={guided}
          onCheckedChange={setGuided}
        />
      </Stack>
    );
  },
};

export const Indeterminate: Story = {
  render: function Render() {
    const [shared, setShared] = useState([true, false, true]);
    const all = shared.every(Boolean);
    const some = shared.some(Boolean);
    const names = ["Ash", "Kayu", "Bren"];
    return (
      <Stack gap="2">
        <Checkbox
          label="Share with every character"
          checked={all}
          indeterminate={some && !all}
          onCheckedChange={(checked) => setShared(names.map(() => checked))}
        />
        <Stack gap="2" paddingInlineStart="7">
          {names.map((name, index) => (
            <Checkbox
              key={name}
              label={name}
              checked={shared[index]}
              onCheckedChange={(checked) =>
                setShared((previous) =>
                  previous.map((value, i) => (i === index ? checked : value)),
                )
              }
            />
          ))}
        </Stack>
      </Stack>
    );
  },
};

/** Two sizes: `sm` for dense lists and `md`, the default. */
export const Sizes: Story = {
  render: () => (
    <Stack gap="3">
      <Checkbox
        size="sm"
        label="Small"
        description="For dense lists, such as a track's options."
        defaultChecked
      />
      <Checkbox
        size="md"
        label="Medium"
        description="The default, for forms and settings."
        defaultChecked
      />
    </Stack>
  ),
};

/**
 * The description sits under the title, lined up with it. Pressing the
 * description toggles too; the checkbox is named by its title and described
 * by the line under it.
 */
export const WithDescriptions: Story = {
  render: () => (
    <Stack gap="2" maxWidth="420px">
      <Checkbox
        label="Wounded"
        description="You are injured and suffer -1 to health."
      />
      <Checkbox
        label="Shaken"
        description="You are frightened or despairing, -1 to spirit."
        defaultChecked
      />
      <Checkbox
        label="Unprepared"
        description="You are out of supplies, -1 to supply."
      />
    </Stack>
  ),
};

/**
 * A checkbox with no visible text, named by `aria-label` alone, as on a
 * progress track's boxes.
 */
export const WithoutVisibleLabel: Story = {
  render: () => <Checkbox aria-label="Mark progress" defaultChecked />,
};
