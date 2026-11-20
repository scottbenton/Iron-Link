import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Box, Stack } from "ui/primitives";

import {
  classicRules,
  starforgedRules,
} from "../../../docs/fixtures/datasworn";
import { ImpactGroup, ImpactsChecklist } from "../ImpactsChecklist";

const meters: Record<string, string> = {
  health: "Health",
  spirit: "Spirit",
  supply: "Supply",
};

// Datasworn's `rules.impacts`, shaped as the checklist's groups.
function groupsFrom(rules: {
  rules: {
    impacts: Record<
      string,
      {
        label: string;
        contents: Record<
          string,
          { label: string; prevents_recovery?: string[] }
        >;
      }
    >;
  };
}): ImpactGroup[] {
  return Object.entries(rules.rules.impacts).map(([key, group]) => ({
    key,
    label: group.label,
    impacts: Object.entries(group.contents).map(([impactKey, impact]) => ({
      key: impactKey,
      label: impact.label,
      description: impact.prevents_recovery?.length
        ? `Blocks ${impact.prevents_recovery.map((m) => meters[m] ?? m).join(" and ")} recovery`
        : undefined,
    })),
  }));
}

const starforgedGroups = groupsFrom(starforgedRules);
const classicGroups = groupsFrom(classicRules);

const meta = {
  title: "Game/ImpactsChecklist",
  component: ImpactsChecklist,
  args: {
    groups: starforgedGroups,
    value: { wounded: true, battered: true },
  },
  decorators: [
    (Story) => (
      <Box maxWidth="640px">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof ImpactsChecklist>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Starforged: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    const marked = Object.values(value).filter(Boolean).length;
    return (
      <ImpactsChecklist
        {...args}
        value={value}
        onChange={(key, isMarked) =>
          setValue((v) => ({ ...v, [key]: isMarked }))
        }
        footer={`Max momentum +${10 - marked}, reset +${marked === 0 ? 2 : marked === 1 ? 1 : 0}`}
      />
    );
  },
};

export const IronswornDebilities: Story = {
  render: function Render() {
    const [value, setValue] = useState<Record<string, boolean>>({
      shaken: true,
      maimed: true,
      cursed: true,
    });
    return (
      <ImpactsChecklist
        groups={classicGroups}
        wording="ironsworn"
        value={value}
        onChange={(key, isMarked) =>
          setValue((v) => ({ ...v, [key]: isMarked }))
        }
      />
    );
  },
};

export const ReadOnly: Story = {
  args: { value: { wounded: true, shaken: true, doomed: true } },
};

export const NoneMarked: Story = {
  render: () => (
    <Stack gap="6">
      <ImpactsChecklist
        groups={starforgedGroups}
        value={{}}
        onChange={() => {}}
        size="sm"
      />
      <ImpactsChecklist
        groups={starforgedGroups}
        value={{}}
        onChange={() => {}}
        disabled
      />
    </Stack>
  ),
};
