import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert } from "ui/components/Alert";
import { Form } from "ui/components/Form";
import { Stepper } from "ui/components/Stepper";
import { PageContent, PageHeader } from "ui/layout";

import { useDocumentTitle } from "hooks/useDocumentTitle";
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
import { useCreateGameSubmit } from "./hooks/useCreateGameSubmit";
import { getSteps } from "./steps";

export default function CreateGamePage() {
  const { t } = useTranslation();
  const title = t("game.create.new-game", "New Game");
  useDocumentTitle(title);
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

  const steps = useMemo(() => getSteps(t, gameType), [t, gameType]);

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const rulePackageError = useDataswornTreeStore((store) => store.rulesError);
  const { create, creating } = useCreateGameSubmit(setError);

  const isLastStep = step === steps.length - 1;

  const goToStep = useCallback((index: number) => {
    setError(undefined);
    setStep(index);
  }, []);

  // Enter in a field moves on, or creates the game on the last step.
  const handleSubmit = useCallback(() => {
    if (creating) return;
    if (isLastStep) {
      create();
      return;
    }
    const stepError = steps[step]?.checkStepForErrors?.(
      useCreateGameStore.getState(),
    );
    if (stepError) {
      setError(stepError);
      return;
    }
    goToStep(step + 1);
  }, [creating, isLastStep, create, steps, step, goToStep]);

  if (!uid) {
    return null;
  }

  const shownError = error || rulePackageError;

  return (
    <>
      <PageHeader title={title} />
      <PageContent>
        <SyncRulesPackages />
        <Form onSubmit={handleSubmit} gap="6" css={{ maxWidth: "900px" }}>
          <Stepper
            aria-label={t("game.create.steps-label", "Steps")}
            steps={steps.map((stepConfig) => ({ label: stepConfig.label }))}
            activeStep={step}
            onStepSelect={creating ? undefined : goToStep}
          />
          {shownError && (
            <Alert tone="danger" role="alert">
              {shownError}
            </Alert>
          )}
          {steps[step]?.component}
          <StepButtons
            canGoBack={step > 0 && !creating}
            onBack={() => goToStep(step - 1)}
            isLastStep={isLastStep}
            actionLabel={steps[step]?.actionLabel}
            loadingLabel={steps[step]?.loadingLabel}
            creating={creating}
          />
        </Form>
      </PageContent>
    </>
  );
}
