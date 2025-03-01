import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  StepsCompletedContent,
  StepsContent,
  StepsItem,
  StepsList,
  StepsPrevTrigger,
  StepsRoot,
} from "@/components/ui/steps";
import { useGameCreateTranslations } from "@/hooks/i18n/useGameCreateTranslations";
import { pageConfig } from "@/pages/pageConfig";
import { GameType } from "@/repositories/game.repository";
import { useUID } from "@/stores/auth.store";
import { useCreateCharacterStore } from "@/stores/createCharacter.store";
import { useCreateGameStore } from "@/stores/createGame.store";
import {
  Alert,
  Button,
  Card,
  Group,
  StepsChangeDetails,
  StepsNextTrigger,
} from "@chakra-ui/react";
import { TFunction } from "i18next";
import { useCallback, useState } from "react";
import { useLocation } from "wouter";

import { CreateCharacter } from "../shared/CreateCharacter/CreateCharacter";
import { GameDetails } from "./ChooseGameDetails";
import { ChooseGameRules } from "./ChooseGameRules";
import { ChooseGameType } from "./ChooseGameType";
import { SyncRulesPackages } from "./SyncRulesPackages";

function validateStep(step: number, t: TFunction): string | undefined {
  if (step === 0) {
    return;
  } else if (step === 1) {
    const rulesetConfig = useCreateGameStore.getState().rulesets;

    const isAnyRulesetActive = Object.values(rulesetConfig).some(
      (isActive) => isActive,
    );

    if (!isAnyRulesetActive) {
      return t("validation.no-rulesets-selected", "No rulesets selected");
    }
    return;
  } else if (step === 2) {
    const state = useCreateGameStore.getState();
    if (state.gameType === GameType.Solo) {
      const characterState = useCreateCharacterStore.getState();
      const characterName = characterState.characterName;
      if (!characterName) {
        return t("validation.no-character-name", "No character name provided");
      }
    } else {
      const gameName = state.gameName;
      if (!gameName) {
        return t("validation.no-game-name", "No game name provided");
      }
      return;
    }
  }
}

export default function GameCreatePage() {
  const t = useGameCreateTranslations();

  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | undefined>();

  const createGame = useCreateGameStore((store) => store.createGame);
  const createCharacter = useCreateCharacterStore(
    (store) => store.createCharacter,
  );
  const uid = useUID();

  const navigate = useLocation()[1];

  const handleGameCreate = useCallback(() => {
    if (!uid) return;
    const gameType = useCreateGameStore.getState().gameType;
    const gameName =
      gameType === GameType.Solo
        ? useCreateCharacterStore.getState().characterName
        : useCreateGameStore.getState().gameName;

    createGame(uid, gameName)
      .then((gameId) => {
        if (gameType === GameType.Solo) {
          createCharacter(gameId, uid)
            .then((characterId) => {
              navigate(pageConfig.gameCharacter(gameId, characterId));
            })
            .catch(() => {
              setStepError(
                t(
                  "game.create.error-creating-character",
                  "Error creating character",
                ),
              );
              setStep(2);
            });
        } else {
          navigate(pageConfig.game(gameId));
        }
      })
      .catch((e) => {
        console.error(e);
        setStepError(
          t("game.create.error-creating-game", "Error creating game"),
        );
        setStep(2);
      });
  }, [navigate, t, uid, createGame, createCharacter]);

  const handleStepChange = useCallback(
    (evt: StepsChangeDetails) => {
      const nextStep = evt.step;
      if (nextStep < step) {
        setStep(nextStep);
      }
      if (nextStep > step) {
        const validationError = validateStep(step, t);
        if (validationError) {
          setStepError(validationError);
        } else {
          setStepError(undefined);
          setStep(nextStep);
          if (nextStep > 2) {
            handleGameCreate();
          }
        }
      }
    },
    [step, t, handleGameCreate],
  );

  const selectedGameType = useCreateGameStore((store) => store.gameType);

  return (
    <>
      <SyncRulesPackages />
      <PageHeader title="Create Game" maxW="breakpoint-md" />
      <PageContent maxW="breakpoint-md" disableGuttersOnMobile>
        <Card.Root flexGrow={1} borderBottomRadius={0} borderBottomWidth={0}>
          <Card.Body>
            <StepsRoot step={step} onStepChange={handleStepChange} count={3}>
              <StepsList alignItems={{ base: "flex-start", sm: undefined }}>
                <StepsItem
                  index={0}
                  title={t("choose-game-type-step", "Choose Game Type")}
                />
                <StepsItem
                  index={1}
                  title={t("choose-rulesets-step", "Choose Rulesets")}
                />
                <StepsItem
                  index={2}
                  title={
                    selectedGameType === GameType.Solo
                      ? t("create-character-step", "Create Character")
                      : t("game-details-step", "Game Details")
                  }
                />
              </StepsList>
              {stepError && (
                <Alert.Root status="error">
                  <Alert.Indicator />
                  <Alert.Description>{stepError}</Alert.Description>
                </Alert.Root>
              )}
              <StepsContent index={0} mt={4}>
                <ChooseGameType />
              </StepsContent>
              <StepsContent index={1} mt={4}>
                <ChooseGameRules />
              </StepsContent>
              <StepsContent index={2} mt={4}>
                {selectedGameType === GameType.Solo ? (
                  <CreateCharacter />
                ) : (
                  <GameDetails />
                )}
              </StepsContent>
              <StepsCompletedContent>
                {t("create-pending", "Creating your game...")}
              </StepsCompletedContent>
              {step <= 2 && (
                <Group justifyContent="flex-end" mt={2}>
                  <StepsPrevTrigger asChild>
                    <Button variant="subtle">
                      {t("previous-button", "Previous", { ns: "common" })}
                    </Button>
                  </StepsPrevTrigger>
                  <StepsNextTrigger asChild>
                    <Button>
                      {t("next-button", "Next", { ns: "common" })}
                    </Button>
                  </StepsNextTrigger>
                </Group>
              )}
            </StepsRoot>
          </Card.Body>
        </Card.Root>
      </PageContent>
    </>
  );
}
