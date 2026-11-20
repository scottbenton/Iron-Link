import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { HStack, Stack } from "ui/primitives";

import { Button } from "../../Button";
import { Stepper } from "../Stepper";

const createGameSteps = [
  { label: "Game Type" },
  { label: "Rules" },
  { label: "Characters", description: "Optional" },
  { label: "Review" },
];

const meta: Meta<typeof Stepper> = {
  title: "Components/Stepper",
  component: Stepper,
  args: { steps: createGameSteps, activeStep: 1 },
  argTypes: {
    activeStep: { control: { type: "range", min: 0, max: 4 } },
  },
};

export default meta;
type Story = StoryObj<typeof Stepper>;

export const Playground: Story = {};

/** The create game flow: completed steps are buttons back to them. */
export const CreateGame: Story = {
  render: function Render() {
    const [step, setStep] = useState(2);
    const last = createGameSteps.length - 1;
    return (
      <Stack gap="6" maxWidth="640px">
        <Stepper
          aria-label="Create game"
          steps={createGameSteps}
          activeStep={step}
          onStepSelect={setStep}
        />
        <HStack gap="2" justifyContent="flex-end">
          <Button
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
          >
            Back
          </Button>
          <Button
            variant="primary"
            disabled={step > last}
            onClick={() => setStep(step + 1)}
          >
            {step >= last ? "Create Game" : "Next"}
          </Button>
        </HStack>
      </Stack>
    );
  },
};
