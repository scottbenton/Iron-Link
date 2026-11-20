import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "ui/primitives";

import { Text } from "../../Text";
import { PreviewCard } from "../PreviewCard";
import { PreviewCardContent } from "../PreviewCardContent";
import { PreviewCardTrigger } from "../PreviewCardTrigger";

const meta = {
  title: "Components/PreviewCard",
  component: PreviewCard,
  parameters: { layout: "centered" },
} satisfies Meta<typeof PreviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A preview card opens on hover or focus; it holds no controls. */
export const Default: Story = {
  render: () => (
    <Stack gap="2" maxWidth="360px">
      <Text variant="bodySm">
        Swear an iron vow to find{" "}
        <PreviewCard>
          <PreviewCardTrigger href="#kara">Kara Ironhand</PreviewCardTrigger>
          <PreviewCardContent>
            <Stack gap="1">
              <Text variant="h4" as="p">
                Kara Ironhand
              </Text>
              <Text variant="bodySm" color="muted">
                A shield-bearer of the Hinterlands, last seen on the road to
                Deepwater.
              </Text>
            </Stack>
          </PreviewCardContent>
        </PreviewCard>{" "}
        before the winter.
      </Text>
    </Stack>
  ),
};
