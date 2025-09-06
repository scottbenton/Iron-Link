import { Alert, Step, StepLabel, Stepper } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { PageContent, PageHeader } from "components/Layout";

import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useUID } from "stores/auth.store";
import { useCreateCharacterStore } from "stores/createCharacter.store";
import { useCreateGameStore } from "stores/createGame.store";
import { useDataswornTreeStore } from "stores/dataswornTree.store";

import { StepButtons } from "./components/StepButtons";
import { SyncRulesPackages } from "./components/SyncRulesPackages";
import { getSteps } from "./steps";

export default function CreateGamePage() {
  const { t } = useTranslation();
  useSendPageViewEvent(PageCategory.GameCreate);

  const uid = useUID();

  const gameType = useCreateGameStore((store) => store.gameType);
  const resetGame = useCreateGameStore((store) => store.reset);
  const resetCharacter = useCreateCharacterStore((store) => store.reset);

  useEffect(() => {
    return () => {
      resetGame();
      resetCharacter();
    };
  }, [resetGame, resetCharacter]);

  const steps = useMemo(() => {
    return getSteps(t, gameType);
  }, [t, gameType]);

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const rulePackageError = useDataswornTreeStore((store) => store.rulesError);

  if (!uid) {
    return null;
  }

  return (
    <>
      <PageHeader label={t("game.create.new-game", "New Game")} maxWidth="md" />
      <PageContent maxWidth="md">
        {/* TODO - see if we can make this imperitive (on the next click)  */}
        <SyncRulesPackages />
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
          {steps.map((stepConfig) => (
            <Step key={stepConfig.label}>
              <StepLabel>{stepConfig.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {(error || rulePackageError) && (
          <Alert severity="error" variant="filled" sx={{ mb: 2 }}>
            {error || rulePackageError}
          </Alert>
        )}
        {steps[step]?.component}
        <StepButtons
          step={step}
          steps={steps}
          setError={setError}
          setStep={setStep}
        />
      </PageContent>
    </>
  );
}
