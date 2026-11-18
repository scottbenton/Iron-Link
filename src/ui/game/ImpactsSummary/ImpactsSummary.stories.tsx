import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within } from "storybook/test";

import { Box } from "ui/primitives";

import {
  classicRules,
  starforgedRules,
} from "../../stories/fixtures/datasworn";
import type { ImpactGroup } from "../ImpactsChecklist";
import { ImpactsSummary, ImpactsSummaryProps } from "./ImpactsSummary";

type LooseImpacts = Record<
  string,
  { label: string; contents: Record<string, { label: string }> }
>;

// Datasworn's `rules.impacts`, shaped as the checklist's groups.
const groupsFrom = (impacts: LooseImpacts): ImpactGroup[] =>
  Object.entries(impacts).map(([key, group]) => ({
    key,
    label: group.label,
    impacts: Object.entries(group.contents).map(([impactKey, impact]) => ({
      key: impactKey,
      label: impact.label,
    })),
  }));

const starforgedGroups = groupsFrom(starforgedRules.rules.impacts);
const classicGroups = groupsFrom(classicRules.rules.impacts);

/** Starforged's momentum rule, from the dialog's draft. */
const momentumNote = (draft: Record<string, boolean | undefined>) => {
  const marked = Object.values(draft).filter(Boolean).length;
  return `Max momentum +${10 - marked}, reset +${Math.max(0, 2 - marked)}`;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Holds the saved marks, as the character store would. */
function Stateful(
  props: ImpactsSummaryProps & {
    /** How long each save takes. */
    delay?: number;
    /** Impacts whose saves fail, as if offline. */
    failing?: string[];
  },
) {
  const { value: initial, onImpactChange, delay = 0, failing, ...rest } = props;
  const [value, setValue] = useState(initial);
  return (
    <ImpactsSummary
      {...rest}
      value={value}
      onImpactChange={
        onImpactChange &&
        (async (key, marked) => {
          if (delay) await wait(delay);
          if (failing?.includes(key)) throw new Error("offline");
          await onImpactChange(key, marked);
          setValue((current) => ({ ...current, [key]: marked }));
        })
      }
    />
  );
}

const meta = {
  title: "Game/ImpactsSummary",
  component: ImpactsSummary,
  args: {
    groups: starforgedGroups,
    value: { wounded: true, battered: true },
    onImpactChange: () => {},
    dialogFooter: momentumNote,
  },
  render: (args) => <Stateful {...args} />,
  decorators: [
    (Story) => (
      <Box maxWidth="360px">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof ImpactsSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * As on the live sheet: what is marked, and Edit. Each box in the dialog
 * saves as it is ticked; Done only closes it.
 */
export const Starforged: Story = {};

/** Nothing marked: the card says None. */
export const NoneMarked: Story = {
  args: { value: {} },
};

/** Many marked: the chips wrap in a narrow column. */
export const ManyMarked: Story = {
  args: {
    value: {
      wounded: true,
      shaken: true,
      unprepared: true,
      permanently_harmed: true,
      traumatized: true,
      doomed: true,
      tormented: true,
      indebted: true,
      battered: true,
      cursed: true,
    },
  },
  decorators: [
    (Story) => (
      <Box maxWidth="280px">
        <Story />
      </Box>
    ),
  ],
};

/** Someone else's character: no Edit button. */
export const ReadOnly: Story = {
  args: { onImpactChange: undefined, value: { shaken: true, doomed: true } },
};

/** Ironsworn says Debilities. */
export const IronswornDebilities: Story = {
  args: {
    groups: classicGroups,
    wording: "ironsworn",
    value: { maimed: true, cursed: true },
    dialogFooter: undefined,
  },
};

/** The dialog, open. Opened by pressing Edit Impacts. */
export const DialogOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Edit Impacts" }));
  },
};

/**
 * Slow saves: a tick shows at once (in the dialog and on the card behind
 * it) while it saves, two seconds each.
 */
export const SlowSaves: Story = {
  render: (args) => <Stateful {...args} delay={2000} />,
};

/**
 * A tick that fails: tick Shaken and, after a moment, the box goes back and
 * the dialog shows an error that stays until dismissed. Other boxes save.
 */
export const TickFails: Story = {
  render: (args) => <Stateful {...args} delay={600} failing={["shaken"]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Edit Impacts" }));
  },
};
