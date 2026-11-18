import type { Meta, StoryObj } from "@storybook/react-vite";

import { css } from "styled-system/css";

import { Button } from "../../components/Button";
import { Text } from "../../components/Text";
import { pageStyles, sectionStyles } from "./foundationStyles";

const meta: Meta = {
  title: "Foundations/Motion",
  parameters: { layout: "fullscreen" },
};
export default meta;

const durations = [
  {
    name: "instant",
    value: "80ms",
    use: "Press and release, exits of small things",
  },
  { name: "fast", value: "140ms", use: "Hover colour, ring fade in" },
  { name: "normal", value: "200ms", use: "Popups and menus entering" },
  { name: "slow", value: "280ms", use: "Dialogs, drawers, height changes" },
];

const easings = [
  {
    name: "out",
    value: "cubic-bezier(0.23, 1, 0.32, 1)",
    use: "Entering, responding to a person",
  },
  {
    name: "inOut",
    value: "cubic-bezier(0.77, 0, 0.175, 1)",
    use: "Moving on screen",
  },
  { name: "in", value: "cubic-bezier(0.4, 0, 1, 1)", use: "Leaving" },
];

const rowStyles = css({
  display: "grid",
  gridTemplateColumns: "100px 200px minmax(0, 1fr)",
  gap: "4",
  alignItems: "baseline",
  paddingBlock: "2",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.subtle",
});

export const Tokens: StoryObj = {
  render: () => (
    <div className={pageStyles}>
      <div>
        <Text variant="eyebrow">Foundations</Text>
        <Text variant="h1">Motion</Text>
        <Text color="muted">
          Short and quiet. Hover changes colour only; a press sinks a pressable
          thing 1px onto its ledge; things enter with the out curve and leave
          faster with the in curve. Reduced motion, from the system or from Iron
          Link&apos;s accessibility settings, removes travel and spin and keeps
          fades.
        </Text>
      </div>
      <section className={sectionStyles}>
        <Text variant="h2">Durations</Text>
        {durations.map((token) => (
          <div key={token.name} className={rowStyles}>
            <Text variant="bodySm" weight="medium" as="code">
              {token.name}
            </Text>
            <Text variant="bodySm" color="muted">
              {token.value}
            </Text>
            <Text variant="bodySm">{token.use}</Text>
          </div>
        ))}
      </section>
      <section className={sectionStyles}>
        <Text variant="h2">Easing</Text>
        {easings.map((token) => (
          <div key={token.name} className={rowStyles}>
            <Text variant="bodySm" weight="medium" as="code">
              {token.name}
            </Text>
            <Text variant="caption" color="muted" as="code">
              {token.value}
            </Text>
            <Text variant="bodySm">{token.use}</Text>
          </div>
        ))}
      </section>
      <section className={sectionStyles}>
        <Text variant="h2">Press</Text>
        <Text variant="bodySm" color="muted">
          Press and hold these to feel the 1px travel onto the ledge.
        </Text>
        <div className={css({ display: "flex", gap: "3", flexWrap: "wrap" })}>
          <Button>Outline</Button>
          <Button variant="primary">Primary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost (no ledge)</Button>
        </div>
      </section>
    </div>
  ),
};
