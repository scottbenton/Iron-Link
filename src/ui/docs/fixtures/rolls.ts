/**
 * Sample rolls for stories, in the library's own roll shapes
 * (`ui/game/RollCard`). Oracle results are real Starforged rows: Action 42 is
 * Evade, Theme 87 is Survival and Spaceborne Peril 67 is Power fails.
 */
import type {
  ActionRollData,
  OracleRollData,
  ProgressRollData,
} from "../../game/RollCard/rollTypes";

/** Face Danger +edge: a strong hit with a match. */
export const faceDangerStrongHit: ActionRollData = {
  kind: "action",
  moveName: "Face Danger",
  statName: "Edge",
  statValue: 3,
  actionDie: 4,
  actionScore: 7,
  challengeDice: [5, 5],
  outcome: "strongHit",
};

/** Strike +iron with adds: a miss. */
export const strikeMiss: ActionRollData = {
  kind: "action",
  moveName: "Strike",
  statName: "Iron",
  statValue: 2,
  adds: 1,
  actionDie: 3,
  actionScore: 6,
  challengeDice: [7, 9],
  outcome: "miss",
};

/** Secure an Advantage +wits: a weak hit. */
export const secureAnAdvantageWeakHit: ActionRollData = {
  kind: "action",
  moveName: "Secure an Advantage",
  statName: "Wits",
  statValue: 2,
  actionDie: 5,
  actionScore: 7,
  challengeDice: [3, 8],
  outcome: "weakHit",
};

/** Compel +heart turned into a strong hit by burning 9 momentum. */
export const compelBurnedMomentum: ActionRollData = {
  kind: "action",
  moveName: "Compel",
  statName: "Heart",
  statValue: 2,
  actionDie: 2,
  actionScore: 4,
  challengeDice: [5, 8],
  outcome: "strongHit",
  momentumBurned: 9,
};

/** Gather Information +wits with the action die cancelled by -2 momentum. */
export const gatherInformationCancelled: ActionRollData = {
  kind: "action",
  moveName: "Gather Information",
  statName: "Wits",
  statValue: 1,
  actionDie: 2,
  actionScore: 1,
  challengeDice: [3, 6],
  outcome: "miss",
  negativeMomentumCancelled: true,
};

/** Endure Harm +health: a one on the action die. */
export const endureHarmOne: ActionRollData = {
  kind: "action",
  moveName: "Endure Harm",
  statName: "Health",
  statValue: 3,
  actionDie: 1,
  actionScore: 4,
  challengeDice: [2, 6],
  outcome: "weakHit",
};

/** Ask the Oracle, Likely: yes, with a match. */
export const askTheOracleLikely: OracleRollData = {
  kind: "oracle",
  oracleName: "Likely",
  category: "Ask the Oracle",
  roll: 44,
  result: "Yes",
  match: true,
};

/** Fulfill Your Vow on a dangerous vow with eight boxes: a weak hit. */
export const fulfillYourVowProgress: ProgressRollData = {
  kind: "progress",
  moveName: "Fulfill Your Vow",
  trackName: "Recover the Hollow Crown",
  progressScore: 8,
  challengeDice: [3, 9],
  outcome: "weakHit",
};

/** Take Decisive Action on a fight: a strong hit with a match. */
export const takeDecisiveActionProgress: ProgressRollData = {
  kind: "progress",
  moveName: "Take Decisive Action",
  trackName: "Duel with the Blood Raider",
  progressScore: 6,
  challengeDice: [4, 4],
  outcome: "strongHit",
};

/** Action + Theme, a shared roll across two core oracle tables. */
export const actionAndTheme: OracleRollData = {
  kind: "oracle",
  oracleName: "Action + Theme",
  category: "Core Oracles",
  roll: [42, 87],
  result: [
    { label: "Action", text: "Evade" },
    { label: "Theme", text: "Survival" },
  ],
};

/** A single oracle table roll. */
export const spaceSighting: OracleRollData = {
  kind: "oracle",
  oracleName: "Spaceborne Peril",
  category: "Space Oracles",
  roll: 67,
  result: "Power fails",
};

export const sampleRolls = {
  faceDangerStrongHit,
  strikeMiss,
  secureAnAdvantageWeakHit,
  compelBurnedMomentum,
  gatherInformationCancelled,
  endureHarmOne,
  askTheOracleLikely,
  fulfillYourVowProgress,
  takeDecisiveActionProgress,
  actionAndTheme,
  spaceSighting,
};
