import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";

import { Stack } from "ui/primitives";

import { Combobox, ComboboxOption, ComboboxProps } from "../Combobox";

type SingleComboboxProps = Extract<ComboboxProps, { multiple?: false }>;

const assets: ComboboxOption[] = [
  { value: "alchemist", label: "Alchemist", group: "Paths" },
  { value: "archer", label: "Archer", group: "Paths" },
  { value: "blademaster", label: "Blademaster", group: "Paths" },
  { value: "loyalist", label: "Loyalist", group: "Paths" },
  { value: "wildblood", label: "Wildblood", group: "Paths" },
  { value: "hawk", label: "Hawk", group: "Companions" },
  { value: "hound", label: "Hound", group: "Companions" },
  { value: "kindred", label: "Kindred", group: "Companions" },
  { value: "ironclad", label: "Ironclad", group: "Combat Talents" },
  { value: "shield-bearer", label: "Shield-Bearer", group: "Combat Talents" },
  {
    value: "communion",
    label: "Ritual: Communion",
    group: "Rituals",
    disabled: true,
  },
];

const regions = [
  "Barrier Islands",
  "Ragged Coast",
  "Deep Wilds",
  "Flooded Lands",
  "Havens",
  "Hinterlands",
  "Tempest Hills",
  "Veiled Mountains",
  "Shattered Wastes",
].map((label) => ({
  value: label.toLowerCase().replace(/ /g, "-"),
  label,
}));

const meta = {
  title: "Components/Combobox",
  render: (args) => <Combobox {...args} />,
  args: {
    label: "Region",
    options: regions,
    placeholder: "Search regions",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    variant: { control: "inline-radio", options: ["outline", "quiet"] },
  },
  decorators: [
    (Story) => (
      <Stack maxWidth="380px">
        <Story />
      </Stack>
    ),
  ],
} satisfies Meta<SingleComboboxProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Options with a `group` are listed under group labels. */
export const GroupedAssets: Story = {
  args: {
    label: "Starting Asset",
    options: assets,
    placeholder: "Search assets",
    description: "Ritual: Communion needs the Ritualist path.",
  },
};

/**
 * Chips are filled pills with no border. They wrap onto more rows inside the
 * field, with the input after them. The clear and open buttons stay at the
 * field's end, on the first row.
 */
export const MultipleChips: Story = {
  render: () => (
    <Stack gap="4">
      <Combobox
        multiple
        label="Assets"
        options={assets}
        placeholder="Add an asset"
        defaultValue={["archer", "hawk"]}
        hideSelected
      />
      <Combobox
        multiple
        label="Many assets"
        options={assets}
        placeholder="Add an asset"
        defaultValue={[
          "alchemist",
          "archer",
          "blademaster",
          "loyalist",
          "hawk",
          "shield-bearer",
        ]}
        hideSelected
      />
      <Combobox
        multiple
        size="sm"
        label="Small"
        options={assets}
        placeholder="Add an asset"
        defaultValue={["wildblood", "hound", "kindred", "ironclad"]}
        hideSelected
      />
    </Stack>
  ),
};

/** Options load as you type; the list shows a loading row, then results. */
export const AsyncSearch: Story = {
  render: function Render() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<ComboboxOption[]>([]);
    useEffect(() => {
      setLoading(true);
      const timer = window.setTimeout(() => {
        const text = query.trim().toLowerCase();
        setOptions(
          regions.filter((region) => region.label.toLowerCase().includes(text)),
        );
        setLoading(false);
      }, 600);
      return () => window.clearTimeout(timer);
    }, [query]);
    return (
      <Combobox
        label="Region"
        options={options}
        filter={null}
        loading={loading}
        loadingLabel="Searching regions"
        emptyLabel="No regions match"
        inputValue={query}
        onInputValueChange={setQuery}
        placeholder="Search regions"
      />
    );
  },
};

/** Typing a name that is not listed offers to create it. */
export const CreateOption: Story = {
  render: function Render() {
    const [options, setOptions] = useState(regions);
    const [value, setValue] = useState<string | null>(null);
    return (
      <Combobox
        label="Region"
        options={options}
        value={value}
        onValueChange={setValue}
        placeholder="Search or add a region"
        onCreate={(text) => {
          const option = { value: text.toLowerCase(), label: text };
          setOptions((previous) => [...previous, option]);
          setValue(option.value);
        }}
      />
    );
  },
};

/** Free text: any typed tag becomes a chip on Enter. */
export const FreeTextTags: Story = {
  render: () => (
    <Combobox
      multiple
      freeText
      label="Tags"
      options={[
        { value: "npc", label: "NPC" },
        { value: "faction", label: "Faction" },
        { value: "settlement", label: "Settlement" },
      ]}
      placeholder="Add a tag"
      description="Press Enter to add a tag that is not listed."
    />
  ),
};

export const States: Story = {
  render: () => (
    <Stack gap="4">
      <Combobox
        label="Region"
        options={regions}
        required
        description="Where your journey starts."
        error="Choose the region your journey starts in."
      />
      <Combobox
        label="Region"
        options={regions}
        defaultValue="havens"
        readOnly
      />
      <Combobox
        label="Region"
        options={regions}
        defaultValue="havens"
        disabled
      />
    </Stack>
  ),
};
