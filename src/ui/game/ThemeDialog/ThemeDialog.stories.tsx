import { Palette } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "ui/components/Button";
import { Text } from "ui/components/Text";
import { schemes } from "ui/theme";

import { Stack } from "styled-system/jsx";

import { sampleCharacters } from "../../stories/fixtures/characters";
import {
  ThemeChange,
  ThemeDialog,
  ThemeDialogCharacter,
  ThemeDialogGame,
  ThemeDialogProps,
  ThemeTarget,
} from "./ThemeDialog";
import { ThemeChoice } from "./resolveTheme";

const [kira, orrin, senna] = sampleCharacters;

const ashkar: ThemeDialogCharacter = {
  id: "ashkar",
  name: "Ashkar Wren",
  colorSeed: 32,
  theme: "cinder",
};

interface HarnessProps {
  characters: ThemeDialogCharacter[];
  currentCharacterId?: string;
  game?: ThemeDialogGame;
  appTheme: ThemeChoice;
  initialOpen?: ThemeTarget;
  date?: Date;
  /** Makes Save fail, to show the error. */
  failSave?: boolean;
}

function describeChange(change: ThemeChange, names: Record<string, string>) {
  const target =
    change.target.kind === "character"
      ? names[change.target.id]
      : change.target.kind === "game"
        ? "This game"
        : "App theme";
  const theme = change.theme ? schemes[change.theme].label : "falls back";
  return `${target}: ${theme}`;
}

/**
 * Keeps what Save sends, so reopening shows it, and lists the last changes
 * under the button.
 */
function Harness(props: HarnessProps) {
  const { currentCharacterId, initialOpen, date, failSave } = props;
  const [open, setOpen] = useState(true);
  const [characters, setCharacters] = useState(props.characters);
  const [game, setGame] = useState(props.game);
  const [appTheme, setAppTheme] = useState(props.appTheme);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const names = Object.fromEntries(
    characters.map((character) => [character.id, character.name]),
  );

  const handleSave: ThemeDialogProps["onSave"] = (changes) =>
    new Promise<void>((resolve, reject) => {
      window.setTimeout(() => {
        if (failSave) {
          reject(new Error("offline"));
          return;
        }
        for (const change of changes) {
          const { target, theme } = change;
          if (target.kind === "character") {
            setCharacters((previous) =>
              previous.map((character) =>
                character.id === target.id
                  ? { ...character, theme }
                  : character,
              ),
            );
          } else if (target.kind === "game") {
            setGame((previous) => previous && { ...previous, theme });
          } else {
            setAppTheme(theme);
          }
        }
        setLastSaved(
          changes.map((change) => describeChange(change, names)).join("; "),
        );
        resolve();
      }, 700);
    });

  return (
    <Stack gap="3" alignItems="flex-start">
      <Button startIcon={<Palette />} onClick={() => setOpen(true)}>
        Theme
      </Button>
      <Text variant="bodySm" color="muted" role="status">
        {lastSaved ? `Saved ${lastSaved}.` : "Nothing saved yet."}
      </Text>
      <ThemeDialog
        open={open}
        onClose={() => setOpen(false)}
        characters={characters}
        currentCharacterId={currentCharacterId}
        game={game}
        appTheme={appTheme}
        onSave={handleSave}
        initialOpen={initialOpen}
        date={date}
      />
    </Stack>
  );
}

const meta: Meta<typeof Harness> = {
  title: "Game/ThemeDialog",
  component: Harness,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Harness>;

const sunderedIsles: ThemeDialogGame = {
  name: "Tides of the Sundered Isles",
  theme: "myriad",
  canEdit: true,
};

/**
 * Scott as the Guide of his Sundered Isles game, opened from Kira's
 * character menu: his two characters first (Kira open now, so her choices
 * start open), then Senna, whom Morgan shared with him, then the game
 * (Myriad, blue) and his app theme. Kira and Senna use the game's theme;
 * Ashkar has Cinder of his own.
 */
export const GuidedGameAsGuide: Story = {
  args: {
    characters: [
      { ...kira, theme: null },
      ashkar,
      { ...senna, theme: null, sharedBy: senna.playerName },
    ],
    currentCharacterId: kira.id,
    game: sunderedIsles,
    appTheme: null,
    initialOpen: { kind: "character", id: kira.id },
    date: new Date(2026, 10, 18),
  },
};

/**
 * Opened from game settings: no character is open now, and the game's
 * choices start open.
 */
export const FromGameSettings: Story = {
  args: {
    ...GuidedGameAsGuide.args,
    currentCharacterId: undefined,
    initialOpen: { kind: "game" },
  },
};

/**
 * Parham in a co-op Starforged game. Everyone in a co-op game can change its
 * theme (Eidolon), and Scott shared Kira with the table. Parham's app theme
 * is Mystic, which this game's theme covers.
 */
export const CoopPlayer: Story = {
  args: {
    characters: [
      { ...orrin, theme: null },
      { ...kira, theme: "hinterlands", sharedBy: kira.playerName },
    ],
    currentCharacterId: orrin.id,
    game: {
      name: "Beyond the Forge",
      theme: "eidolon",
      canEdit: true,
    },
    appTheme: "mystic",
    date: new Date(2026, 10, 18),
  },
};

/**
 * Morgan as a player in Scott's guided game: the game row shows its theme
 * and why it can't be changed here.
 */
export const GuidedGameAsPlayer: Story = {
  args: {
    characters: [{ ...senna, theme: null }],
    currentCharacterId: senna.id,
    game: { ...sunderedIsles, canEdit: false },
    appTheme: "gloaming",
    date: new Date(2026, 10, 18),
  },
};

/**
 * A solo game has no game row: the character's "Use my app theme" falls
 * straight to Scott's app theme (Hinterlands).
 */
export const SoloGame: Story = {
  args: {
    characters: [{ ...kira, theme: null }],
    currentCharacterId: kira.id,
    appTheme: "hinterlands",
    initialOpen: { kind: "character", id: kira.id },
    date: new Date(2026, 10, 18),
  },
};

/**
 * In June, Automatic resolves to Pride, so every row that falls all the way
 * back shows it.
 */
export const AutomaticInJune: Story = {
  args: {
    characters: [{ ...kira, theme: null }],
    currentCharacterId: kira.id,
    game: { ...sunderedIsles, theme: null },
    appTheme: null,
    initialOpen: { kind: "app" },
    date: new Date(2026, 5, 12),
  },
};

const longNames: HarnessProps = {
  characters: [
    {
      id: "long-1",
      name: "Aldric Thornwood-Vasquez of the Hollow Reach",
      colorSeed: 80,
      theme: null,
    },
    {
      id: "long-2",
      name: "Maelis Oathbound, Last Warden of the Tempest Hills",
      colorSeed: 300,
      theme: "orchid",
    },
    {
      id: "long-3",
      name: "Sister Ysolde Brightwater-Kaine",
      colorSeed: 190,
      theme: null,
      sharedBy: "Morgan Ashcombe-Delacroix",
    },
  ],
  currentCharacterId: "long-1",
  game: {
    name: "The Long Night Beneath the Shattered Moons of Kirin",
    theme: "gloaming",
    canEdit: true,
  },
  appTheme: "myriad",
  initialOpen: { kind: "character", id: "long-1" },
  date: new Date(2026, 10, 18),
};

/** Long names wrap; the marks and the theme line wrap under them. */
export const LongNames: Story = { args: longNames };

/**
 * At phone width the dialog fills the screen; rows keep the portrait,
 * text and Change button on one line, and the choices open full width under
 * the row.
 */
export const PhoneWidth: Story = {
  args: GuidedGameAsGuide.args,
  globals: { viewport: { value: "mobile1", isRotated: false } },
};

/** Long names at phone width. */
export const PhoneWidthLongNames: Story = {
  args: longNames,
  globals: { viewport: { value: "mobile1", isRotated: false } },
};

/**
 * Change a theme and Save: the save fails, the error stays in the dialog,
 * and the draft is kept so Save can be tried again.
 */
export const SaveFails: Story = {
  args: { ...GuidedGameAsGuide.args, failSave: true },
};
