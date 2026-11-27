import { TFunction } from "i18next";
import { ReactElement } from "react";

import { CreateGameState } from "stores/createGame.store";

import { GameType } from "repositories/game.repository";

import { ChooseGameType } from "./components/ChooseGameType";
import { CreateCharacter } from "./components/CreateCharacter";
import { GameDetails } from "./components/GameDetails";
import { RulesetExpansionSection } from "./components/RulesetExpansionSection";

export interface StepConfig {
  label: string;
  component: ReactElement;
  /** The last step's submit label. */
  actionLabel?: string;
  /** The last step's submit label while it is creating. */
  loadingLabel?: string;
  /** Run on Next: a message that stops the step, or nothing. */
  checkStepForErrors?: (state: CreateGameState) => string | undefined;
}

const chooseGameTypeStep = (t: TFunction): StepConfig => ({
  label: t("game.create.choose-game-type-step", "Choose Game Type"),
  component: <ChooseGameType />,
});
const chooseRulesetStep = (t: TFunction): StepConfig => ({
  label: t("game.create.choose-rulesets-step", "Choose Rulesets"),
  component: <RulesetExpansionSection />,
  checkStepForErrors: (state) => {
    if (
      Object.values(state.rulesets).filter((isActive) => isActive).length === 0
    ) {
      return t(
        "game.create.rulesets-required-error",
        "Please select at least one ruleset",
      );
    }
  },
});
const createCharacterStep = (t: TFunction): StepConfig => ({
  label: t("game.create.create-character-step", "Create Character"),
  component: <CreateCharacter />,
  actionLabel: t("game.create.create-character-submit", "Create Character"),
  loadingLabel: t("game.create.creating-character", "Creating Character"),
});

const gameSettingsStep = (t: TFunction): StepConfig => ({
  label: t("game.create.game-details-step", "Game Details"),
  component: <GameDetails />,
  actionLabel: t("game.create.create-game-submit", "Create Game"),
  loadingLabel: t("game.create.creating-game", "Creating Game"),
});

export function getSteps(t: TFunction, gameType: GameType): StepConfig[] {
  if (gameType === GameType.Solo) {
    return [
      chooseGameTypeStep(t),
      chooseRulesetStep(t),
      createCharacterStep(t),
    ];
  }
  return [chooseGameTypeStep(t), chooseRulesetStep(t), gameSettingsStep(t)];
}
