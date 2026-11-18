/**
 * More sample rolls for the roll card, dice and game log stories, on top of
 * `stories/fixtures/rolls`, so every roll type the app logs has an example.
 * Story-only. Oracle text is real Datasworn rows: Sundered Isles' Island Name
 * and Cursed Island Name, Crew Characteristics and Cursed Crew, Offshore
 * Observations, and Starforged's Sector Trouble and Withstand Damage.
 */
import { sampleRolls } from "../../stories/fixtures/rolls";
import type {
  ActionRollData,
  ClockRollData,
  OracleRollData,
  ProgressRollData,
} from "./rollTypes";

/** Withstand Damage +integrity: a miss with a match, a critical low. */
export const withstandDamageMissMatch: ActionRollData = {
  kind: "action",
  moveName: "Withstand Damage",
  statName: "Integrity",
  statValue: 2,
  actionDie: 3,
  actionScore: 5,
  challengeDice: [9, 9],
  outcome: "miss",
};

/** Compel +the protocol bot's health with adds, capped at 10. */
export const compelProtocolBot: ActionRollData = {
  kind: "action",
  moveName: "Compel",
  statName: "Protocol Bot health",
  statValue: 4,
  adds: 1,
  actionDie: 6,
  actionScore: 11,
  challengeDice: [10, 3],
  outcome: "weakHit",
};

/** Secure an Advantage +shadow with +1 from an asset (Sundered Isles). */
export const secureAnAdvantageShadow: ActionRollData = {
  kind: "action",
  moveName: "Secure an Advantage",
  statName: "Shadow",
  statValue: 2,
  adds: 1,
  actionDie: 5,
  actionScore: 8,
  challengeDice: [2, 6],
  outcome: "strongHit",
};

/**
 * Face Danger +heart at -4 momentum with a 4 on the action die: negative
 * momentum matched it, so the die counts as 0.
 */
export const faceDangerNegativeMomentum: ActionRollData = {
  kind: "action",
  moveName: "Face Danger",
  statName: "Heart",
  statValue: 3,
  actionDie: 4,
  actionScore: 3,
  challengeDice: [2, 7],
  outcome: "weakHit",
  negativeMomentumCancelled: true,
};

/** Continue a Legacy on the quests legacy track (a special track). */
export const continueALegacyQuests: ProgressRollData = {
  kind: "progress",
  moveName: "Continue a Legacy",
  trackName: "Quests",
  progressScore: 4,
  challengeDice: [2, 7],
  outcome: "weakHit",
};

/** Ironsworn's Write Your Epilogue on the bonds track (a special track). */
export const writeYourEpilogueBonds: ProgressRollData = {
  kind: "progress",
  moveName: "Write Your Epilogue",
  trackName: "Bonds",
  progressScore: 7,
  challengeDice: [1, 6],
  outcome: "strongHit",
};

/** Finish an Expedition on an expedition track: a miss. */
export const finishAnExpeditionMiss: ProgressRollData = {
  kind: "progress",
  moveName: "Finish an Expedition",
  trackName: "Survey the Ruins of Vexis",
  progressScore: 3,
  challengeDice: [5, 8],
  outcome: "miss",
};

/** A campaign clock advancing on Likely odds, with a match. */
export const clockAdvances: ClockRollData = {
  kind: "clock",
  clockName: "The Iron Syndicate seizes the Bleakhold mines",
  oddsName: "Likely",
  roll: 33,
  result: "Yes",
  match: true,
};

/** A clock that holds on Unlikely odds. */
export const clockHolds: ClockRollData = {
  kind: "clock",
  clockName: "The storm reaches the Ironbound Reef",
  oddsName: "Unlikely",
  roll: 58,
  result: "No",
};

/** Island Name with a 10 on the cursed die: Cursed Island Name replaces it. */
export const islandNameCursed: OracleRollData = {
  kind: "oracle",
  oracleName: "Island Name",
  category: "Islands",
  roll: 9,
  result: "Blight",
  cursedDie: 10,
  cursed: true,
};

/** Crew Characteristics with a 10 on the cursed die: Cursed Crew adds to it. */
export const crewCursedAdds: OracleRollData = {
  kind: "oracle",
  oracleName: "Crew Characteristics",
  category: "Take Command",
  roll: 12,
  result: "Adventurers and trailblazers, seeking the far horizon",
  cursedDie: 10,
  cursedResult: "Bound to the ship, unable to sail another",
};

/** Offshore Observations with the cursed die short of 10: no curse. */
export const offshoreObservations: OracleRollData = {
  kind: "oracle",
  oracleName: "Offshore Observations",
  category: "Islands",
  roll: 5,
  result: "Bobbing cargo just offshore",
  cursedDie: 4,
};

/** A long oracle name and a long result. */
export const sectorTrouble: OracleRollData = {
  kind: "oracle",
  oracleName: "Step 10: Introduce a Sector Trouble",
  category: "Launching Your Campaign",
  roll: 23,
  result: "Devastating superweapon has fallen into the wrong hands",
};

/** The longest kind of oracle text: a move's own table. */
export const withstandDamageTable: OracleRollData = {
  kind: "oracle",
  oracleName: "Withstand Damage",
  category: "Suffer Moves",
  roll: 7,
  result:
    "Immediate catastrophic destruction. All aboard must Endure Harm or Face Death, as appropriate.",
};

export const extraRolls = {
  withstandDamageMissMatch,
  compelProtocolBot,
  secureAnAdvantageShadow,
  faceDangerNegativeMomentum,
  continueALegacyQuests,
  writeYourEpilogueBonds,
  finishAnExpeditionMiss,
  clockAdvances,
  clockHolds,
  islandNameCursed,
  crewCursedAdds,
  offshoreObservations,
  sectorTrouble,
  withstandDamageTable,
};

/** Every sample roll, grouped by what the app logs. */
export const rollsByType = {
  "Action roll": {
    "Strong hit with a match": sampleRolls.faceDangerStrongHit,
    "Weak hit": sampleRolls.secureAnAdvantageWeakHit,
    Miss: sampleRolls.strikeMiss,
    "Miss with a match": withstandDamageMissMatch,
    "Burned momentum": sampleRolls.compelBurnedMomentum,
    "Negative momentum cancels the action die": faceDangerNegativeMomentum,
    "One on the action die": sampleRolls.endureHarmOne,
    "Score capped at 10": compelProtocolBot,
  },
  "Progress roll": {
    Vow: sampleRolls.fulfillYourVowProgress,
    "Fight, strong hit with a match": sampleRolls.takeDecisiveActionProgress,
    Expedition: finishAnExpeditionMiss,
  },
  "Special track roll": {
    "Quests legacy": continueALegacyQuests,
    "Ironsworn bonds": writeYourEpilogueBonds,
  },
  "Oracle roll": {
    "Ask the Oracle": sampleRolls.askTheOracleLikely,
    "One table": sampleRolls.spaceSighting,
    "Shared roll": sampleRolls.actionAndTheme,
    "Long name and result": sectorTrouble,
  },
  "Cursed oracle roll": {
    "Cursed table replaces the result": islandNameCursed,
    "Cursed table adds a result": crewCursedAdds,
    "Cursed die short of 10": offshoreObservations,
  },
  "Clock roll": {
    "Clock advances, with a match": clockAdvances,
    "Clock holds": clockHolds,
  },
};

export const allRolls = { ...sampleRolls, ...extraRolls };
