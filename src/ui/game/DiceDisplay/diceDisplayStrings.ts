import type { TFunction } from "i18next";

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
  /** Shown under an action die that negative momentum cancelled. */
  cancelledCaption: string;
}

export function getDefaultDiceDisplayStrings(t: TFunction): DiceDisplayStrings {
  return {
    actionCaption: t("ui.dice-display.action", "Action"),
    addsCaption: t("ui.dice-display.adds", "Adds"),
    scoreCaption: t("ui.dice-display.score", "Score"),
    challengeCaption: t("ui.dice-display.challenge", "Challenge"),
    momentumCaption: t("ui.dice-display.momentum", "Momentum"),
    progressCaption: t("ui.dice-display.progress", "Progress"),
    oracleCaption: t("ui.dice-display.oracle", "Roll"),
    cursedCaption: t("ui.dice-display.cursed", "Cursed"),
    versus: t("ui.dice-display.versus", "vs"),
    cancelledCaption: t("ui.dice-display.cancelled", "Cancelled"),
  };
}
