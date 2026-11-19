/**
 * The game page on a phone, with the decisions of the mobile redesign
 * (scottbenton/Iron-Link draft PRs 338 to 346). See PhoneGamePage.tsx for
 * the list of what each screen carries.
 *
 * These stories set the viewport to the phone's own size, so sheets,
 * menus and dialogs, which portal to the page, open over the phone rather
 * than over a desktop-sized canvas, and phone-only rules (full-screen
 * dialogs) apply.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";

import { withstandDamageTable } from "../../game/RollCard/RollCard.fixtures";
import { sampleRolls } from "../../stories/fixtures/rolls";
import { PhoneGamePage } from "./PhoneGamePage";

const meta: Meta<typeof PhoneGamePage> = {
  title: "Examples/Phone game page",
  component: PhoneGamePage,
  parameters: {
    layout: "fullscreen",
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
};

export default meta;
type Story = StoryObj<typeof PhoneGamePage>;

const threeRolls = [
  sampleRolls.secureAnAdvantageWeakHit,
  sampleRolls.askTheOracleLikely,
  sampleRolls.faceDangerStrongHit,
];

/**
 * The Sheet: Overview, Assets and Tracks as 48px tabs; initiative as a
 * segmented control; stats as roll buttons; meters two to a row with 44px
 * steppers; impacts as a card that opens a dialog. Roll a stat to see the
 * roll dock.
 */
export const Sheet: Story = { args: { section: "sheet" } };

/**
 * The game's overview, from Game overview in the character switcher: the
 * first nav item becomes Overview, with the game's characters and players,
 * its shared assets and its tracks. Pick Kira in the switcher to go back.
 */
export const Overview: Story = {
  name: "Game overview",
  args: { page: "overview", section: "sheet" },
};

/** An Ironsworn game: Debilities and the classic initiative words. */
export const SheetIronsworn: Story = {
  name: "Sheet, Ironsworn",
  args: { section: "sheet", ruleset: "ironsworn" },
};

/**
 * Notes: the open note's name and a square count of open notes. Tap the
 * text to edit.
 */
export const Notes: Story = { args: { section: "notes" } };

/**
 * Editing a note: the formatting toolbar rides on the keyboard (drawn as a
 * hatched stand-in) and ends with Done editing; the bottom nav steps aside.
 * Escape also ends editing.
 */
export const NotesEditing: Story = {
  name: "Notes, editing",
  args: { section: "notes" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("textbox", { name: /text$/ }),
    );
  },
};

/**
 * The open notes sheet: a row per open note with its own Close, New note in
 * the header and All notes at the foot.
 */
export const OpenNotesSheet: Story = {
  name: "Notes, open notes sheet",
  args: { section: "notes" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /^Open notes/ }),
    );
  },
};

/** Moves by category. */
export const Moves: Story = { args: { section: "moves" } };

/** Oracles by collection. Roll one to see the roll dock. */
export const Oracles: Story = { args: { section: "oracles" } };

/** The game log, filling the screen above the nav. */
export const Log: Story = { args: { section: "log" } };

/**
 * Three rolls: the newest card over the edges of two older ones, with an
 * "3 rolls" handle above.
 */
export const Rolls: Story = {
  name: "Rolls",
  args: { section: "sheet", rolls: threeRolls },
};

/** A snackbar stacks above the rolls rather than over them. */
export const RollsWithSnackbar: Story = {
  name: "Rolls, with snackbar",
  args: { section: "sheet", rolls: threeRolls, notice: true },
};

/** A long result folds behind Show all. */
export const RollsLongResult: Story = {
  name: "Rolls, long result",
  args: { section: "oracles", rolls: [withstandDamageTable] },
};

/** The handle opens Recent rolls, newest first, with Clear all. */
export const RecentRollsOpen: Story = {
  name: "Rolls, recent rolls sheet",
  args: { section: "sheet", rolls: threeRolls },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "3 rolls" }),
    );
  },
};

/**
 * The character switcher in the top bar: the game's characters with the
 * current one checked, Add Character, then Game overview.
 */
export const CharacterSwitcherOpen: Story = {
  name: "Top bar, character switcher",
  args: { section: "sheet" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /Kira Vale/ }),
    );
  },
};

/** The gear menu: Second Screen, the game's settings, the character's. */
export const SettingsMenuOpen: Story = {
  name: "Top bar, settings menu",
  args: { section: "sheet" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", {
        name: "Game and Character Settings",
      }),
    );
  },
};
