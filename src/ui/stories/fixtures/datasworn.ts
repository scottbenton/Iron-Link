/**
 * Real rules content for stories. Story-only: nothing outside *.stories.tsx
 * and fixtures may import this, so the JSON never reaches the app bundle.
 */
import classic from "@datasworn-community/ironsworn-classic/json/classic.json";
import starforged from "@datasworn-community/starforged/json/starforged.json";

// The JSON is typed loosely on purpose; stories read a handful of fields.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;

export const starforgedRules: Loose = starforged;
export const classicRules: Loose = classic;

export const starforgedMove = (category: string, key: string): Loose =>
  starforgedRules.moves[category].contents[key];
export const classicMove = (category: string, key: string): Loose =>
  classicRules.moves[category].contents[key];

export const starforgedAsset = (category: string, key: string): Loose =>
  starforgedRules.assets[category].contents[key];
export const classicAsset = (category: string, key: string): Loose =>
  classicRules.assets[category].contents[key];

/** A few well-known entries, handy as story args. */
export const sampleMoves = {
  faceDanger: starforgedMove("adventure", "face_danger"),
  gatherInformation: starforgedMove("adventure", "gather_information"),
  strike: starforgedMove("combat", "strike"),
  payThePrice: starforgedMove("fate", "pay_the_price"),
  askTheOracle: starforgedMove("fate", "ask_the_oracle"),
  undertakeAnExpedition: starforgedMove("exploration", "undertake_an_expedition"),
  fulfillYourVow: starforgedMove("quest", "fulfill_your_vow"),
};

export const sampleAssets = {
  starship: starforgedAsset("command_vehicle", "starship"),
  ace: starforgedAsset("path", "ace"),
  navigator: starforgedAsset("path", "navigator"),
  protocolBot: starforgedAsset("companion", "protocol_bot"),
  marked: starforgedAsset("deed", "marked"),
  ironswornHawk: classicAsset("companion", "hawk"),
  ironswornDuelist: classicAsset("combat_talent", "duelist"),
};
