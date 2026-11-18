import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { screen, userEvent, within } from "storybook/test";

import { css } from "styled-system/css";
import { Box, Stack } from "styled-system/jsx";

import { Text } from "../../components/Text";
import { sampleCharacters } from "../../stories/fixtures/characters";
import { PhoneGamePage } from "../Examples/PhoneGamePage";
import { getNavItems } from "../Examples/storyData";
import { NavRail } from "../NavRail";
import { SettingsMenu } from "./SettingsMenu";
import {
  DemoCharacterSettingsMenu,
  DemoSettingsMenu,
} from "./SettingsMenuDemo";
import {
  SettingsScenario,
  gamesListScenario,
  guideScenario,
  playerScenario,
  soloScenario,
} from "./settingsMenuScenarios";
import { SettingsMenuAction } from "./settingsMenuSections";
import { defaultSettingsMenuStrings } from "./settingsMenuStrings";

const meta: Meta<typeof SettingsMenu> = {
  title: "Layout/SettingsMenu",
  component: SettingsMenu,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof SettingsMenu>;

const frameStyles = css({
  display: "flex",
  height: "640px",
  "--app-shell-height": "100%",
  background: "bg.canvas",
});

const pageStyles = css({
  flex: 1,
  padding: "6",
  background: "bg.surface",
});

const actionNames: Record<SettingsMenuAction, string> = {
  characterDetails: defaultSettingsMenuStrings.characterDetails,
  characterStats: defaultSettingsMenuStrings.characterStats,
  characterAccess: defaultSettingsMenuStrings.characterAccess,
  gameName: defaultSettingsMenuStrings.gameName,
  gameRulesets: defaultSettingsMenuStrings.gameRulesets,
  gameNotifications: defaultSettingsMenuStrings.gameNotifications,
  secondScreen: defaultSettingsMenuStrings.secondScreen,
  theme: defaultSettingsMenuStrings.theme,
  accessibility: defaultSettingsMenuStrings.accessibility,
  advancedFeatures: defaultSettingsMenuStrings.advancedFeatures,
  admin: defaultSettingsMenuStrings.admin,
  signOut: defaultSettingsMenuStrings.signOut,
};

/** The nav rail with the gear at its foot, beside a page that says who is looking. */
function RailPage(props: { scenario: SettingsScenario; caption: string }) {
  const { scenario, caption } = props;
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className={frameStyles}>
      <NavRail
        items={getNavItems("games")}
        homeHref="#games"
        actions={
          <DemoSettingsMenu
            scenario={scenario}
            side="inline-end"
            align="end"
            tooltipSide="right"
            onSelect={(action) => setLast(`Chose ${actionNames[action]}.`)}
            onDeleted={(what) =>
              setLast(
                what === "game"
                  ? "Deleted the game."
                  : "Deleted the character.",
              )
            }
          />
        }
      />
      <Stack className={pageStyles} gap="2">
        <Text variant="h2" as="h1">
          {scenario.character?.name ?? scenario.game?.name ?? "Your Games"}
        </Text>
        <Text color="muted">{caption}</Text>
        <Text variant="bodySm" color="muted" role="status">
          {last ?? "Open Settings at the foot of the rail."}
        </Text>
      </Stack>
    </div>
  );
}

const openSettings: Story["play"] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(
    await canvas.findByRole("button", { name: "Settings" }),
  );
};

/**
 * Scott, the Guide of a guided game, on his character Kira: Kira Vale
 * Settings, then Game Settings (all of them, Delete Game last), Change
 * Theme, then App Settings. Change Theme opens the Theme dialog on Kira's
 * row.
 */
export const GuideOnCharacter: Story = {
  name: "Game page, Guide on a character",
  render: () => (
    <RailPage
      scenario={guideScenario}
      caption="The Guide of The Drowned Archive, with Kira Vale open."
    />
  ),
  play: openSettings,
};

/**
 * Parham, a player in that game, on his own Orrin: all of Orrin's settings,
 * but from the game only what applies to him (Notification Settings and
 * Second Screen). The game's theme shows read only in the Theme dialog.
 */
export const Player: Story = {
  name: "Game page, player",
  render: () => (
    <RailPage
      scenario={playerScenario}
      caption="A player in The Drowned Archive, with Orrin Thale open."
    />
  ),
  play: openSettings,
};

/**
 * A player on a character someone shared with them to edit: no Edit Access
 * or Delete Character, which stay with the owner.
 */
export const PlayerOnSharedCharacter: Story = {
  name: "Game page, player on a shared character",
  render: () => (
    <RailPage
      scenario={{
        ...playerScenario,
        character: { name: sampleCharacters[2].name, isOwner: false },
      }}
      caption="Senna Ash-Eye, shared with this player to edit."
    />
  ),
  play: openSettings,
};

/** On the games list: Change Theme (the app theme) and App Settings only. */
export const GamesList: Story = {
  name: "Games list",
  render: () => (
    <RailPage
      scenario={gamesListScenario}
      caption="No game or character, so only the app's settings."
    />
  ),
  play: openSettings,
};

/** An admin also gets Admin Settings. */
export const GamesListAdmin: Story = {
  name: "Games list, admin",
  render: () => (
    <RailPage
      scenario={{ ...gamesListScenario, isAdmin: true }}
      caption="Signed in as an admin."
    />
  ),
  play: openSettings,
};

/**
 * A solo game: no Edit Access, no Notification Settings, and Change Theme
 * covers the characters and the app (a solo game has no theme of its own).
 */
export const SoloGame: Story = {
  name: "Solo game",
  render: () => (
    <RailPage
      scenario={soloScenario}
      caption="Kira Vale alone in Ashes of the Ironlands."
    />
  ),
  play: openSettings,
};

/**
 * A long character name wraps in its section label rather than widening the
 * menu past 360px.
 */
export const LongName: Story = {
  name: "Long character name",
  render: () => (
    <RailPage
      scenario={{
        ...guideScenario,
        character: {
          name: "Senna Ash-Eye, Sworn Keeper of the Hollow Crown",
          isOwner: true,
        },
      }}
      caption="A character with a long name."
    />
  ),
  play: openSettings,
};

/** Delete Game asks first, with Keep Game focused. */
export const DeleteGameConfirm: Story = {
  name: "Delete Game confirm",
  render: () => (
    <RailPage
      scenario={guideScenario}
      caption="Choose Delete Game to see the question."
    />
  ),
  play: async (context) => {
    await openSettings(context);
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Delete Game" }),
    );
  },
};

/**
 * The phone: the top bar's gear opens the same combined menu, Second Screen
 * included (phones have no Reference tab for it).
 */
export const Phone: Story = {
  parameters: {
    viewport: {
      options: {
        phoneFrame: {
          name: "Phone (390 x 760)",
          styles: { width: "390px", height: "760px" },
          type: "mobile",
        },
      },
    },
  },
  globals: { viewport: { value: "phoneFrame", isRotated: false } },
  render: () => <PhoneGamePage />,
  play: openSettings,
};

const columnHeaderStyles = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "350px",
  paddingInline: "4",
  paddingBlock: "3",
  borderBlockEnd: "1px solid token(colors.border.subtle)",
  background: "bg.surface",
});

/**
 * The character column's own menu keeps only Kira's actions, as a shortcut:
 * no game or app settings. Change Theme opens the same Theme dialog on
 * Kira's row.
 */
export const CharacterColumnMenu: Story = {
  name: "Character column menu",
  parameters: { layout: "padded" },
  render: () => (
    <Box className={columnHeaderStyles}>
      <Text variant="h3" as="h2">
        Character
      </Text>
      <DemoCharacterSettingsMenu />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Character Settings" }),
    );
  },
};
