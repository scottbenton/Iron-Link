/**
 * Who is looking, and where, for the settings menu stories. Story-only.
 */
import { sampleCharacters } from "../../docs/fixtures/characters";
import { ThemeDialogCharacter, ThemeDialogGame } from "../../game/ThemeDialog";
import { SettingsMenuContext } from "./settingsMenuSections";

const [kira, orrin, senna] = sampleCharacters;

/** Who is looking, where: the menu's context plus the Theme dialog's data. */
export interface SettingsScenario extends SettingsMenuContext {
  /** Every character in the game the person can edit, for the Theme dialog. */
  themeCharacters: ThemeDialogCharacter[];
  currentCharacterId?: string;
  themeGame?: ThemeDialogGame;
}

const drownedArchive = "The Drowned Archive";

/** Scott, the Guide of a guided Starforged game, on Scott's character Kira. */
export const guideScenario: SettingsScenario = {
  character: { name: kira.name, isOwner: true },
  game: { name: drownedArchive, isGuide: true, secondScreen: true },
  themeCharacters: [
    { ...kira, theme: null },
    { ...senna, theme: null, sharedBy: senna.playerName },
  ],
  currentCharacterId: kira.id,
  themeGame: { name: drownedArchive, theme: "myriad", canEdit: true },
};

/** Phoebe, a player in that game, on their own character Orrin. */
export const playerScenario: SettingsScenario = {
  character: { name: orrin.name, isOwner: true },
  game: { name: drownedArchive, isGuide: false, secondScreen: true },
  themeCharacters: [{ ...orrin, theme: "cinder" }],
  currentCharacterId: orrin.id,
  themeGame: {
    name: drownedArchive,
    theme: "myriad",
    canEdit: false,
    readOnlyReason: "Only the game's Guides can change its theme.",
  },
};

/** Scott on the games list: no character and no game. */
export const gamesListScenario: SettingsScenario = {
  themeCharacters: [],
};

const ashesOfTheIronlands = "Ashes of the Ironlands";
const soloGame = {
  name: ashesOfTheIronlands,
  isGuide: true,
  solo: true,
  secondScreen: true,
};

/**
 * Scott alone with Kira in a solo Ironsworn game. With one character the
 * game holds the theme, so the Theme dialog shows This game and Everywhere.
 */
export const soloScenario: SettingsScenario = {
  character: { name: kira.name, isOwner: true },
  game: { ...soloGame, characterCount: 1 },
  themeCharacters: [{ ...kira, theme: null }],
  currentCharacterId: kira.id,
  themeGame: {
    name: ashesOfTheIronlands,
    theme: "hinterlands",
    canEdit: true,
    solo: true,
  },
};

/** The same solo game once Scott adds Orrin: character rows come back. */
export const soloTwoCharactersScenario: SettingsScenario = {
  ...soloScenario,
  game: { ...soloGame, characterCount: 2 },
  themeCharacters: [
    { ...kira, theme: null },
    { ...orrin, theme: "cinder" },
  ],
};
