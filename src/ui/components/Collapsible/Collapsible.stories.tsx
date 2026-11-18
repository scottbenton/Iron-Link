import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useState } from "react";

import { Stack } from "ui/primitives";

import { sampleMoves } from "../../stories/fixtures/datasworn";
import { Button } from "../Button";
import { Text } from "../Text";
import {
  Collapse,
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "./Collapsible";

const meta: Meta<typeof Collapsible> = {
  title: "Components/Collapsible",
  component: Collapsible,
};

export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: () => (
    <Stack maxWidth="480px">
      <Collapsible>
        <CollapsibleTrigger>Show move text</CollapsibleTrigger>
        <CollapsiblePanel>
          <Text variant="bodySm">{sampleMoves.faceDanger.text}</Text>
        </CollapsiblePanel>
      </Collapsible>
    </Stack>
  ),
};

/** `Collapse` is driven by `open` from elsewhere, like MUI's Collapse. */
export const ControlledCollapse: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    const id = useId();
    return (
      <Stack gap="3" maxWidth="480px" alignItems="flex-start">
        <Button
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Hide Oracle" : "Show Oracle"}
        </Button>
        <Collapse open={open} id={id}>
          <Text variant="bodySm">{sampleMoves.askTheOracle.text}</Text>
        </Collapse>
      </Stack>
    );
  },
};
