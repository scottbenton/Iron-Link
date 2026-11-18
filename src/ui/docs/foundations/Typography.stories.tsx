import type { Meta, StoryObj } from "@storybook/react-vite";

import { css } from "styled-system/css";

import { Text } from "../../components/Text";
import type { TextVariant } from "../../components/Text";
import { pageStyles, sectionStyles } from "./foundationStyles";

const meta: Meta = {
  title: "Foundations/Type",
  parameters: { layout: "fullscreen" },
};
export default meta;

const rowStyles = css({
  display: "grid",
  gridTemplateColumns: "140px minmax(0, 1fr)",
  alignItems: "baseline",
  gap: "4",
  paddingBlock: "3",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.subtle",
});

const specimens: {
  variant: NonNullable<TextVariant>;
  sample: string;
  use: string;
}[] = [
  { variant: "display", sample: "The Iron Expanse", use: "Hero titles" },
  { variant: "h1", sample: "Kira Vale", use: "Page title" },
  { variant: "h2", sample: "Character", use: "Column and dialog titles" },
  { variant: "h3", sample: "Assets", use: "Sections" },
  { variant: "h4", sample: "Starship", use: "Card titles" },
  {
    variant: "body",
    sample:
      "When you attempt something risky or react to an imminent threat, envision your action and roll.",
    use: "Body text",
  },
  {
    variant: "bodySm",
    sample: "On a strong hit, you are successful. Take +1 momentum.",
    use: "Dense text, rules",
  },
  { variant: "caption", sample: "Rolled 2 minutes ago", use: "Captions, help" },
  { variant: "label", sample: "Edge", use: "Stat names, labels" },
  { variant: "eyebrow", sample: "Starforged", use: "Above a title" },
];

export const Scale: StoryObj = {
  render: () => (
    <div className={pageStyles}>
      <div>
        <Text variant="eyebrow">Foundations</Text>
        <Text variant="h1">Type</Text>
        <Text color="muted">
          Two faces. Sofia Sans Condensed for titles, labels and numbers, where
          the narrow width lets stats and oracle buttons fit. Allo for
          everything you read. Use Text with a variant; the as prop picks the
          element, so a label that only looks like a heading stays a span.
        </Text>
      </div>
      <section className={sectionStyles}>
        {specimens.map((specimen) => (
          <div key={specimen.variant} className={rowStyles}>
            <div>
              <Text variant="bodySm" weight="medium" as="code">
                {specimen.variant}
              </Text>
              <Text variant="caption" color="muted" as="p">
                {specimen.use}
              </Text>
            </div>
            <Text variant={specimen.variant} as="p">
              {specimen.sample}
            </Text>
          </div>
        ))}
      </section>
    </div>
  ),
};

const numberStyles = css({
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "3xl",
  lineHeight: "none",
  fontVariantNumeric: "tabular-nums",
});

export const Numbers: StoryObj = {
  render: () => (
    <div className={pageStyles}>
      <div>
        <Text variant="eyebrow">Foundations</Text>
        <Text variant="h1">Numbers</Text>
        <Text color="muted">
          Stats, meters and dice use the heading face with tabular figures, so a
          changing value keeps its width.
        </Text>
      </div>
      <div className={css({ display: "flex", gap: "8", flexWrap: "wrap" })}>
        {["+3", "-2", "10", "5", "+10"].map((value) => (
          <span key={value} className={numberStyles}>
            {value}
          </span>
        ))}
      </div>
    </div>
  ),
};
