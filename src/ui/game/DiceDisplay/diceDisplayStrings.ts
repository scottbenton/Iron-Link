export interface DiceDisplayStrings {
  actionCaption: string;
  addsCaption: string;
  scoreCaption: string;
  challengeCaption: string;
  momentumCaption: string;
  progressCaption: string;
  oracleCaption: string;
  cursedCaption: string;
  versus: string;
  /** Shown under a cancelled action die. */
  cancelledCaption: string;
}

export const defaultDiceDisplayStrings: DiceDisplayStrings = {
  actionCaption: "Action",
  addsCaption: "Adds",
  scoreCaption: "Score",
  challengeCaption: "Challenge",
  momentumCaption: "Momentum",
  progressCaption: "Progress",
  oracleCaption: "Roll",
  cursedCaption: "Cursed",
  versus: "vs",
  cancelledCaption: "Cancelled",
};
