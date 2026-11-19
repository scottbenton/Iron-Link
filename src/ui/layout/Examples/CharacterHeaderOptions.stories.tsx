/**
 * Four ways to head the character column's Overview, each shown with a
 * short, a long and a very long name at three sidebar widths (280px, the
 * narrowest a sidebar goes, then 360 and 440px). All of them drop the
 * player's name and bring the character's settings gear in beside the
 * name, out of the tab row, where it crowded the tabs at narrow widths.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReactNode, useState } from "react";

import { css, cx } from "styled-system/css";

import { Text } from "../../components/Text";
import { CharacterPortrait } from "../../game/CharacterPortrait";
import { InitiativeChip } from "../../game/InitiativeChip";
import type { InitiativeStatus } from "../../game/InitiativeChip";
import { DemoCharacterSettingsMenu } from "../SettingsMenu/SettingsMenuDemo";
import { guideScenario } from "../SettingsMenu/settingsMenuScenarios";

const names = [
  "Kira Vale",
  "Seraphina Ashgrove-Blackwater",
  "Captain Isolde Varn-Thessaly of the Ninth Drowned Reach",
];
const widths = [280, 360, 440];

interface HeaderProps {
  name: string;
}

/** The pieces every option shares: initiative state and the gear. */
function useHeaderParts(name: string) {
  const [initiative, setInitiative] = useState<InitiativeStatus>("outOfCombat");
  const chip = (
    <InitiativeChip status={initiative} onStatusChange={setInitiative} />
  );
  const gear = (
    <DemoCharacterSettingsMenu
      scenario={{ ...guideScenario, character: { name, isOwner: true } }}
    />
  );
  return { chip, gear };
}

/* A: portrait beside, the name wraps to two lines and then clamps. */

const rowStyles = css({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  alignItems: "start",
  columnGap: "3",
  rowGap: "1",
});
const rowTextStyles = css({
  display: "grid",
  justifyItems: "start",
  alignSelf: "center",
  gap: "1",
  minWidth: 0,
});
const clampStyles = css({ lineClamp: "2", overflowWrap: "anywhere" });

function RowHeader(props: HeaderProps) {
  const { name } = props;
  const { chip, gear } = useHeaderParts(name);
  return (
    <div className={rowStyles}>
      <CharacterPortrait name={name} size="lg" shape="rounded" decorative />
      <div className={rowTextStyles}>
        <Text variant="h3" as="h3" className={clampStyles}>
          {name}
        </Text>
        {chip}
      </div>
      {gear}
    </div>
  );
}

/* B: the name first, at full width, never cut; portrait and chip below. */

const nameFirstStyles = css({ display: "grid", gap: "2" });
const nameLineStyles = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "start",
  gap: "2",
});
const metaLineStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
});
const wrapStyles = css({ overflowWrap: "anywhere" });

function NameFirstHeader(props: HeaderProps) {
  const { name } = props;
  const { chip, gear } = useHeaderParts(name);
  return (
    <div className={nameFirstStyles}>
      <div className={nameLineStyles}>
        <Text variant="h3" as="h3" className={wrapStyles}>
          {name}
        </Text>
        {gear}
      </div>
      <div className={metaLineStyles}>
        <CharacterPortrait name={name} size="sm" shape="rounded" decorative />
        {chip}
      </div>
    </div>
  );
}

/*
 * C: one compact line, the name cut with an ellipsis; below about 340px the
 * chip drops to a second line under the name.
 */

const lineStyles = css({
  containerType: "inline-size",
});
const lineGridStyles = css({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
  gridTemplateAreas: '"portrait name chip gear"',
  alignItems: "center",
  columnGap: "2",
  rowGap: "1",
  "@container (max-width: 340px)": {
    gridTemplateColumns: "auto minmax(0, 1fr) auto",
    gridTemplateAreas: '"portrait name gear" "portrait chip gear"',
    justifyItems: "start",
  },
});
const truncateStyles = css({
  gridArea: "name",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
const areaStyles = {
  portrait: css({ gridArea: "portrait" }),
  chip: css({ gridArea: "chip" }),
  gear: css({ gridArea: "gear" }),
};

function OneLineHeader(props: HeaderProps) {
  const { name } = props;
  const { chip, gear } = useHeaderParts(name);
  return (
    <div className={lineStyles}>
      <div className={lineGridStyles}>
        <div className={areaStyles.portrait}>
          <CharacterPortrait name={name} size="md" shape="rounded" decorative />
        </div>
        <Text variant="h4" as="h3" className={truncateStyles}>
          {name}
        </Text>
        <div className={areaStyles.chip}>{chip}</div>
        <div className={areaStyles.gear}>{gear}</div>
      </div>
    </div>
  );
}

/* D: a bordered card, the gear in its corner, the name wrapping freely. */

const cardStyles = css({
  position: "relative",
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  alignItems: "center",
  gap: "3",
  padding: "3",
  paddingInlineEnd: "10",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "lg",
  background: "bg.surface",
});
const cardTextStyles = css({
  display: "grid",
  justifyItems: "start",
  gap: "2",
  minWidth: 0,
});
const cornerStyles = css({
  position: "absolute",
  insetBlockStart: "1",
  insetInlineEnd: "1",
});

function CardHeader(props: HeaderProps) {
  const { name } = props;
  const { chip, gear } = useHeaderParts(name);
  return (
    <div className={cardStyles}>
      <CharacterPortrait name={name} size="lg" shape="rounded" decorative />
      <div className={cardTextStyles}>
        <Text variant="h3" as="h3" className={wrapStyles}>
          {name}
        </Text>
        {chip}
      </div>
      <div className={cornerStyles}>{gear}</div>
    </div>
  );
}

/* The grid of widths and names. */

const boardStyles = css({ display: "grid", gap: "8" });
const rowOfFramesStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "start",
  gap: "6",
});
const frameStyles = css({
  display: "grid",
  gap: "2",
  flex: "none",
});
const panelStyles = css({
  padding: "4",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "md",
  background: "bg.default",
});
const frameWidths: Record<number, string> = {
  280: css({ width: "280px" }),
  360: css({ width: "360px" }),
  440: css({ width: "440px" }),
};

function Board(props: {
  render: (name: string) => ReactNode;
  description: string;
}) {
  const { render, description } = props;
  return (
    <div className={boardStyles}>
      <Text variant="bodySm" color="muted">
        {description}
      </Text>
      {names.map((name) => (
        <div key={name} className={rowOfFramesStyles}>
          {widths.map((width) => (
            <div key={width} className={cx(frameStyles, frameWidths[width])}>
              <Text variant="caption" color="muted">
                {width}px
              </Text>
              <div className={panelStyles}>{render(name)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const meta: Meta = {
  title: "Examples/Character Header Options",
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj;

/**
 * A: the current row, tightened. Portrait beside the name, the name wraps
 * to two lines and is then cut, the initiative chip under it, the gear at
 * the row's end. Closest to today; a very long name loses its end.
 */
export const RowWithClamp: Story = {
  name: "A: Row, name clamped to two lines",
  render: () => (
    <Board
      description="Portrait beside the name; the name wraps to two lines, then is cut. Gear at the end of the row."
      render={(name) => <RowHeader name={name} />}
    />
  ),
};

/**
 * B: the name first, with the full width less the gear, wrapping as far as
 * it needs and never cut; a small portrait and the chip on the line below.
 * Long names always read in full, at the cost of height.
 */
export const NameFirst: Story = {
  name: "B: Name first, never cut",
  render: () => (
    <Board
      description="The name takes the full width and is never cut. A small portrait and the initiative chip sit below it."
      render={(name) => <NameFirstHeader name={name} />}
    />
  ),
};

/**
 * C: one compact line, the name cut with an ellipsis, the chip and gear at
 * the end; in a narrow column the chip moves under the name. Shortest, but
 * long names lose the most.
 */
export const OneLine: Story = {
  name: "C: One line, name truncated",
  render: () => (
    <Board
      description="One line: the name is cut with an ellipsis. Under about 340px the initiative chip moves under the name."
      render={(name) => <OneLineHeader name={name} />}
    />
  ),
};

/**
 * D: the identity card from Sheet first, with the gear in its top corner
 * and no player. The name wraps freely beside the portrait.
 */
export const Card: Story = {
  name: "D: Card, gear in the corner",
  render: () => (
    <Board
      description="A bordered card: portrait beside the name, which wraps freely, with the gear in the top corner."
      render={(name) => <CardHeader name={name} />}
    />
  ),
};
