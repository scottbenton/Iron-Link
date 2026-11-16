import type { Datasworn } from "@datasworn-community/core";
import { useTranslation } from "react-i18next";

import { parseRepositoryErrorAndCreateSnackbar } from "providers/SnackbarProvider";

import { useSetAnnouncement } from "stores/appState.store";
import { useWorldTruthsStore } from "stores/worldTruths.store";

import {
  getTruthOptionSubTable,
  rollTruth,
  rollTruthSubTable,
} from "lib/worldTruths.lib";

// Choosing, rolling and writing truths. Failures show a snackbar; the store
// has already put the old choice back.
export function useWorldTruthActions(worldId: string) {
  const { t } = useTranslation();
  const announce = useSetAnnouncement();
  const chooseOption = useWorldTruthsStore((store) => store.chooseOption);
  const setCustomTruth = useWorldTruthsStore((store) => store.setCustomTruth);

  const report = (error: unknown) =>
    parseRepositoryErrorAndCreateSnackbar(error);

  const choose = (
    truthId: string,
    optionId: string,
    subOptionId: string | null,
  ) => chooseOption(worldId, truthId, optionId, subOptionId).catch(report);

  // Rolls without announcing, for Roll unchosen truths, which says it once.
  const rollQuietly = (truth: Datasworn.Truth) => {
    const rolled = rollTruth(truth);
    if (!rolled) return undefined;
    return {
      rolled,
      saving: chooseOption(
        worldId,
        truth._id,
        rolled.option._id,
        rolled.subRow?._id ?? null,
      ),
    };
  };

  const roll = (truth: Datasworn.Truth) => {
    const result = rollQuietly(truth);
    if (!result) return;
    const { rolled } = result;
    announce(
      [
        t("worlds.truths.rolled", "Rolled {{roll}} for {{name}}.", {
          roll: rolled.roll,
          name: truth.name,
        }),
        rolled.option.summary,
        rolled.subRow?.text,
      ]
        .filter(Boolean)
        .join(" "),
    );
    result.saving.catch(report);
  };

  const rollSubOption = (
    truth: Datasworn.Truth,
    option: Datasworn.TruthOption,
  ) => {
    const subTable = getTruthOptionSubTable(option);
    const rolled = subTable && rollTruthSubTable(subTable);
    if (!subTable || !rolled) return;
    announce(
      t("worlds.truths.rolled-row", "Rolled {{roll}} on {{name}}: {{text}}", {
        roll: rolled.roll,
        name: subTable.name,
        text: rolled.row.text,
      }),
    );
    choose(truth._id, option._id, rolled.row._id);
  };

  const rollUnchosen = (truths: Datasworn.Truth[]) => {
    const results = truths.map(rollQuietly).filter((result) => !!result);
    announce(
      t("worlds.truths.rolled-unchosen", "Rolled {{count}} truths.", {
        count: results.length,
        defaultValue_one: "Rolled {{count}} truth.",
      }),
    );
    results.forEach((result) => result.saving.catch(report));
  };

  const writeOwn = (
    truthId: string,
    description: string,
    questStarter: string,
  ) =>
    setCustomTruth(worldId, truthId, description, questStarter).catch(
      (error) => {
        report(error);
        throw error;
      },
    );

  return { choose, roll, rollSubOption, rollUnchosen, writeOwn };
}
