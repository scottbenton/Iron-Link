import {
  BookOpenIcon,
  DotsThreeIcon,
  GearSixIcon,
  NotePencilIcon,
  PlusIcon,
  UserIcon,
} from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { IconButton } from "../../components/IconButton";
import { sampleCharacters } from "../../stories/fixtures/characters";
import { AppShell } from "../AppShell";
import { GameLayout } from "../GameLayout";
import { MobileNav } from "../MobileNav";
import { NavBar } from "../NavBar";
import { NavRail } from "../NavRail";
import { LayoutPanel } from "../shared/layoutPanel";
import {
  CharacterSheetPlaceholder,
  GamePageTabs,
  NotesPlaceholder,
  PhoneFrame,
  ReferencePlaceholder,
} from "./StoryPlaceholders";
import { getNavItems } from "./storyData";

const meta: Meta = {
  title: "Layout/Examples/Game page",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const gameTitle = "The Iron Expanse";

function useGamePanels() {
  const character = sampleCharacters[0];
  const panels: LayoutPanel[] = [
    {
      id: "character",
      title: "Character",
      icon: <UserIcon />,
      content: <CharacterSheetPlaceholder character={character} />,
    },
    {
      id: "reference",
      title: "Reference",
      icon: <BookOpenIcon />,
      content: <ReferencePlaceholder />,
    },
  ];
  const notes: LayoutPanel = {
    id: "notes",
    title: "Notes",
    icon: <NotePencilIcon />,
    actions: (
      <IconButton label="Add Note" size="sm">
        <PlusIcon />
      </IconButton>
    ),
    content: <NotesPlaceholder />,
  };
  return { panels, notes };
}

const settingsButton = (
  <IconButton label="Game Settings">
    <GearSixIcon />
  </IconButton>
);

function DesktopGamePage() {
  const { panels, notes } = useGamePanels();
  // The app keeps these (and remembers them per device).
  const [width, setWidth] = useState(380);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <AppShell
      fill
      rail={
        <NavRail
          items={getNavItems("games")}
          homeHref="#games"
          actions={settingsButton}
        />
      }
      topBar={<NavBar title={gameTitle} items={getNavItems("games")} />}
    >
      <GameLayout
        tabs={<GamePageTabs current="kira" />}
        main={notes}
        startSidebar={{
          panels,
          width,
          onWidthChange: setWidth,
          collapsed,
          onCollapsedChange: setCollapsed,
        }}
      />
    </AppShell>
  );
}

/** A wide screen: the rail, the game's tabs, the sheet beside the notes. */
export const Desktop: Story = {
  render: () => <DesktopGamePage />,
};

function PhoneGamePage() {
  const { panels, notes } = useGamePanels();
  return (
    <PhoneFrame>
      <AppShell
        fill
        topBar={
          <NavBar
            title={gameTitle}
            backHref="#games"
            actions={
              <IconButton label="More Actions">
                <DotsThreeIcon weight="bold" />
              </IconButton>
            }
          />
        }
        bottomNav={<MobileNav items={getNavItems("games")} />}
      >
        <GameLayout
          compact
          tabs={<GamePageTabs current="kira" />}
          main={notes}
          startSidebar={{ panels }}
        />
      </AppShell>
    </PhoneFrame>
  );
}

/**
 * A phone: the notes, the sheet and the reference are full screen sections
 * behind one row of tabs, over the bottom navigation.
 */
export const Phone: Story = {
  parameters: { layout: "padded" },
  render: () => <PhoneGamePage />,
};
