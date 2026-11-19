/**
 * Ways to head the character column's Overview. None shows the player; each
 * brings the character's settings gear in beside the name, out of the tab
 * row, where it crowded the tabs at narrow widths.
 *
 * The boards show each option with a short, a long and a very long name at
 * three sidebar widths (280px, the narrowest a sidebar goes, then 360 and
 * 440px). The "in the page" stories put an option in the real game page,
 * with the long name; drag the sheet's edge to try it at other widths, or
 * pick another option and name in the controls.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { css, cx } from "styled-system/css";

import { Text } from "../../components/Text";
import { InitiativeChip } from "../../game/InitiativeChip";
import type { InitiativeStatus } from "../../game/InitiativeChip";
import { sampleCharacters } from "../../stories/fixtures/characters";
import { AppShell } from "../AppShell";
import { GameLayout } from "../GameLayout";
import { NavBar } from "../NavBar";
import { NavRail } from "../NavRail";
import {
  DemoCharacterSettingsMenu,
  DemoSettingsMenu,
} from "../SettingsMenu/SettingsMenuDemo";
import { guideScenario } from "../SettingsMenu/settingsMenuScenarios";
import { LayoutPanel } from "../shared/layoutPanel";
import {
  CharacterHeader,
  CharacterHeaderOption,
  characterHeaderLabels,
} from "./CharacterHeaders";
import {
  CharacterColumn,
  NotesColumn,
  ReferenceColumn,
} from "./GamePageColumns";
import { GamePageTabs } from "./StoryPlaceholders";
import { characterSections, referenceSections } from "./columnSections";
import { getNavItems } from "./storyData";

const names = [
  "Kira Vale",
  "Seraphina Ashgrove-Blackwater",
  "Captain Isolde Varn-Thessaly of the Ninth Drowned Reach",
];
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

/* The game page, with the chosen header in the character column. */

interface InPageArgs {
  option: CharacterHeaderOption;
  name: string;
}

function GamePageWithHeader(props: InPageArgs) {
  const { option, name } = props;
  const character = { ...sampleCharacters[0], name };
  const [sheetSection, setSheetSection] = useState("overview");
  const [referenceSection, setReferenceSection] = useState("moves");
  const [sheetWidth, setSheetWidth] = useState(350);
  const [referenceWidth, setReferenceWidth] = useState(350);

  // No gear in the column's tab row: it is in the header now.
  const sheet: LayoutPanel = {
    id: "character",
    title: "Character",
    sections: characterSections,
    activeSectionId: sheetSection,
    onActiveSectionChange: setSheetSection,
    content: (
      <CharacterColumn
        character={character}
        section={sheetSection}
        onSectionChange={setSheetSection}
        renderHeader={({ initiative }) => (
          <CharacterHeader
            option={option}
            name={name}
            initiative={initiative}
            gear={<CharacterGear name={name} />}
          />
        )}
      />
    ),
  };
  const reference: LayoutPanel = {
    id: "reference",
    title: "Reference",
    sections: referenceSections,
    activeSectionId: referenceSection,
    onActiveSectionChange: setReferenceSection,
    content: (
      <ReferenceColumn
        section={referenceSection}
        onSectionChange={setReferenceSection}
      />
    ),
  };
  return (
    <AppShell
      fill
      rail={
        <NavRail
          items={getNavItems("games")}
          homeHref="#games"
          actions={
            <DemoSettingsMenu
              rail
              scenario={guideScenario}
              side="inline-end"
              align="end"
              tooltipSide="right"
            />
          }
        />
      }
      topBar={<NavBar title={name} backHref="#overview" />}
    >
      <GameLayout
        tabs={<GamePageTabs current="kira" />}
        main={{
          id: "notes",
          title: "Notes",
          hideTitle: true,
          content: <NotesColumn />,
        }}
        startSidebar={{
          panels: [sheet],
          width: sheetWidth,
          onWidthChange: setSheetWidth,
        }}
        endSidebar={{
          panels: [reference],
          width: referenceWidth,
          onWidthChange: setReferenceWidth,
        }}
      />
    </AppShell>
  );
}

const meta: Meta = {
  title: "Examples/Character Header Options",
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj;
type InPageStory = StoryObj<InPageArgs>;

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

const inPage: InPageStory = {
  parameters: { layout: "fullscreen" },
  argTypes: {
    option: {
      control: "select",
      options: Object.keys(characterHeaderLabels),
      labels: characterHeaderLabels,
    },
    name: { control: "select", options: names },
  },
  render: (args) => <GamePageWithHeader {...args} />,
};

/** A in the game page, with a long name. */
export const InPageRowWithClamp: InPageStory = {
  ...inPage,
  name: "In the page: A",
  args: { option: "rowClamp", name: names[1] },
};

/** A2 in the game page, with a long name. */
export const InPageStackedStart: InPageStory = {
  ...inPage,
  name: "In the page: A2",
  args: { option: "stackedStart", name: names[1] },
};

/** A3 in the game page, with a long name. */
export const InPageStackedCentred: InPageStory = {
  ...inPage,
  name: "In the page: A3",
  args: { option: "stackedCentred", name: names[1] },
};

/** A4 in the game page, with a long name. Narrow the sheet to see it stack. */
export const InPageRowThenStacked: InPageStory = {
  ...inPage,
  name: "In the page: A4",
  args: { option: "rowThenStacked", name: names[1] },
};
