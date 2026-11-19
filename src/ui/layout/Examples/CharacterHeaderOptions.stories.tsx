/**
 * Ways to show the character at the top of the sheet first layout's sheet.
 * None shows the player; each brings the character's settings gear in
 * beside the name.
 *
 * The boards show each option with a short, a long and a very long name at
 * three widths (280, 360 and 440px). To see one in the page, open Examples/
 * Play layouts, "Sheet first, header" stories.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { css, cx } from "styled-system/css";

import { Text } from "../../components/Text";
import { InitiativeChip } from "../../game/InitiativeChip";
import type { InitiativeStatus } from "../../game/InitiativeChip";
import { DemoCharacterSettingsMenu } from "../SettingsMenu/SettingsMenuDemo";
import { guideScenario } from "../SettingsMenu/settingsMenuScenarios";
import {
  CharacterHeader,
  CharacterHeaderOption,
  characterHeaderLabels,
  sampleHeaderNames,
} from "./CharacterHeaders";

const names = sampleHeaderNames;
const widths = [280, 360, 440];

function CharacterGear(props: { name: string }) {
  return (
    <DemoCharacterSettingsMenu
      scenario={{
        ...guideScenario,
        character: { name: props.name, isOwner: true },
      }}
    />
  );
}

/** One option on a board, with its own initiative state. */
function BoardHeader(props: { option: CharacterHeaderOption; name: string }) {
  const { option, name } = props;
  const [initiative, setInitiative] = useState<InitiativeStatus>("outOfCombat");
  return (
    <CharacterHeader
      option={option}
      name={name}
      initiative={
        <InitiativeChip status={initiative} onStatusChange={setInitiative} />
      }
      gear={<CharacterGear name={name} />}
    />
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

function Board(props: { option: CharacterHeaderOption; description: string }) {
  const { option, description } = props;
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
              <div className={panelStyles}>
                <BoardHeader option={option} name={name} />
              </div>
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
  name: characterHeaderLabels.rowClamp,
  render: () => (
    <Board
      option="rowClamp"
      description="Portrait beside the name; the name wraps to two lines, then is cut. Gear at the end of the row."
    />
  ),
};

/**
 * A2: A stacked down the start edge. A larger portrait with the gear across
 * from it, then the name at full width, never cut, then the chip.
 */
export const StackedStart: Story = {
  name: characterHeaderLabels.stackedStart,
  render: () => (
    <Board
      option="stackedStart"
      description="Portrait and gear on the top line, the name below at full width and never cut, then the initiative chip."
    />
  ),
};

/**
 * A3: A stacked and centred, like a profile. The gear sits in the top
 * corner; the name keeps clear of it on both sides so it stays centred.
 */
export const StackedCentred: Story = {
  name: characterHeaderLabels.stackedCentred,
  render: () => (
    <Board
      option="stackedCentred"
      description="Portrait, name and chip centred, one under another. The gear sits in the top corner."
    />
  ),
};

/**
 * A4: A's row while the column has room, A2's stack below 300px of column,
 * where the row left the name too little width.
 */
export const RowThenStacked: Story = {
  name: characterHeaderLabels.rowThenStacked,
  render: () => (
    <Board
      option="rowThenStacked"
      description="A's row, clamped to two lines. Under 300px of column it stacks like A2, and the name is no longer cut."
    />
  ),
};

/**
 * B: the name first, with the full width less the gear, wrapping as far as
 * it needs and never cut; a small portrait and the chip on the line below.
 */
export const NameFirst: Story = {
  name: characterHeaderLabels.nameFirst,
  render: () => (
    <Board
      option="nameFirst"
      description="The name takes the full width and is never cut. A small portrait and the initiative chip sit below it."
    />
  ),
};

/**
 * C: one compact line, the name cut with an ellipsis, the chip and gear at
 * the end; in a narrow column the chip moves under the name.
 */
export const OneLine: Story = {
  name: characterHeaderLabels.oneLine,
  render: () => (
    <Board
      option="oneLine"
      description="One line: the name is cut with an ellipsis. Under about 340px the initiative chip moves under the name."
    />
  ),
};

/**
 * D: the identity card from Sheet first, with the gear in its top corner
 * and no player. The name wraps freely beside the portrait.
 */
export const Card: Story = {
  name: characterHeaderLabels.card,
  render: () => (
    <Board
      option="card"
      description="A bordered card: portrait beside the name, which wraps freely, with the gear in the top corner."
    />
  ),
};
