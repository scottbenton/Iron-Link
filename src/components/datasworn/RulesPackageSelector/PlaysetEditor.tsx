import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Accordion } from "ui/components/Accordion";
import { Alert } from "ui/components/Alert";
import { Checkbox } from "ui/components/Checkbox";
import { Progress } from "ui/components/Progress";
import { Stack } from "ui/primitives";

import { IExpansionConfig, IRulesetConfig } from "data/package.config";

import { PlaysetSection } from "./PlaysetSection";
import {
  PlaysetCollectionKey,
  getReplacedCollectionsAndItems,
} from "./getReplacedCollectionsAndItems";
import { PlaysetDraft } from "./usePlaysetDraft";
import { usePlaysetPackages } from "./usePlaysetPackages";

export interface PlaysetEditorProps {
  rulesets: Record<string, IRulesetConfig>;
  expansions: Record<string, IExpansionConfig>;
  draft: PlaysetDraft;
  setExcluded: (
    level: "collections" | "items",
    kind: PlaysetCollectionKey,
    id: string,
    isExcluded: boolean,
  ) => void;
  setAutoRollCursedDie: (autoRoll: boolean) => void;
}

const collectionKinds: PlaysetCollectionKey[] = ["assets", "moves", "oracles"];

/** The playset dialog's body: the cursed die setting and a section per kind. */
export function PlaysetEditor(props: PlaysetEditorProps) {
  const { rulesets, expansions, draft, setExcluded, setAutoRollCursedDie } =
    props;
  const { t } = useTranslation();

  const packages = usePlaysetPackages(rulesets, expansions);

  // A package that defines the `cursed_by` tag has oracles with cursed
  // alternatives (Sundered Isles). `cursed_version_of` sits on the oracles
  // themselves and is never a package-level tag definition.
  const showCursedDieOptions = useMemo(
    () =>
      Object.values(packages.data).some(
        (rulesPackage) => !!rulesPackage.rules?.tags?.cursed_by,
      ),
    [packages.data],
  );

  const replaced = useMemo(
    () =>
      Object.fromEntries(
        collectionKinds.map((kind) => [
          kind,
          getReplacedCollectionsAndItems(
            packages.data,
            kind,
            draft.collections[kind],
            draft.items[kind],
          ),
        ]),
      ) as Record<
        PlaysetCollectionKey,
        ReturnType<typeof getReplacedCollectionsAndItems>
      >,
    [packages.data, draft.collections, draft.items],
  );

  const sectionLabels: Record<PlaysetCollectionKey, string> = {
    assets: t("playset-editor.assets", "Assets"),
    moves: t("playset-editor.moves", "Moves"),
    oracles: t("playset-editor.oracles", "Oracles"),
  };

  return (
    <Stack gap="4">
      <Alert tone="info">
        {t(
          "playset-editor.exclusions-info",
          "Checked assets, moves, and oracles will be included in your game.",
        )}
      </Alert>

      {packages.loading && (
        <Progress
          label={t("playset-editor.loading", "Loading rules packages")}
        />
      )}
      {packages.error && (
        <Alert tone="danger" role="alert">
          {t("rules-package-load-failure", "Failed to load rulesets")}
        </Alert>
      )}

      {showCursedDieOptions && (
        <Checkbox
          label={t(
            "playset-editor.cursed-die",
            "Automatically Roll Cursed Die?",
          )}
          description={t(
            "playset-editor.cursed-die-info",
            "If checked, the cursed die will be rolled for oracles with a cursed alternative automatically.",
          )}
          checked={!draft.disableAutomaticCursedDieRolls}
          onCheckedChange={setAutoRollCursedDie}
        />
      )}

      {!packages.loading && !packages.error && (
        <Accordion multiple>
          {collectionKinds.map((kind) => (
            <PlaysetSection
              key={kind}
              value={kind}
              label={sectionLabels[kind]}
              rulesPackages={packages.data}
              collectionKey={kind}
              excludedCollections={draft.collections[kind]}
              toggleExcludedCollection={(id, isExcluded) =>
                setExcluded("collections", kind, id, isExcluded)
              }
              excludedItems={draft.items[kind]}
              toggleExcludedItem={(id, isExcluded) =>
                setExcluded("items", kind, id, isExcluded)
              }
              replacedCollections={replaced[kind].replacedCollections}
              replacedItems={replaced[kind].replacedItems}
            />
          ))}
        </Accordion>
      )}
    </Stack>
  );
}
