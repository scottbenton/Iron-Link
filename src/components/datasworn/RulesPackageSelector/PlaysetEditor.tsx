import { Datasworn, IdParser } from "@datasworn/core";
import { Primary } from "@datasworn/core/dist/StringId";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { PlaysetConfig } from "repositories/game.repository";

import { PlaysetSection } from "./PlaysetSection";

export interface PlaysetEditorProps {
  playset: PlaysetConfig;
  setPlayset: (playset: PlaysetConfig) => void;
  rulesets: Record<string, Datasworn.Ruleset>;
  expansions: Record<string, Datasworn.Expansion>;
  onClose: () => void;
}

export function PlaysetEditor(props: PlaysetEditorProps) {
  const { playset, setPlayset, rulesets, expansions, onClose } = props;

  const { t } = useTranslation();

  const tree = useMemo(() => {
    const tree: Record<string, Datasworn.RulesPackage> = {
      ...rulesets,
      ...expansions,
    };
    return tree;
  }, [rulesets, expansions]);
  const showCursedDieOptions = useMemo(() => {
    return Object.values(tree).some((rulesPackage) => {
      return !!rulesPackage.rules?.tags?.cursed_version_of;
    });
  }, [tree]);
  const [disableAutomaticCursedDieRolls, setDisableAutomaticCursedDieRolls] =
    useState(playset.disableAutomaticCursedDieRolls ?? false);

  const [excludedAssetCollections, setExcludedAssetCollections] = useState(
    playset.excludes?.assetCategories ?? {},
  );
  const [excludedAssets, setExcludedAssets] = useState(
    playset.excludes?.assets ?? {},
  );
  const { replacedAssetCollections, replacedAssets } = useMemo(() => {
    const { replacedCollections, replacedItems } =
      getReplacedCollectionsAndItemsFromExpansions(
        tree,
        "assets",
        excludedAssetCollections,
        excludedAssets,
      );
    return {
      replacedAssetCollections: replacedCollections,
      replacedAssets: replacedItems,
    };
  }, [tree, excludedAssetCollections, excludedAssets]);

  const [excludedMoveCollections, setExcludedMoveCollections] = useState(
    playset.excludes?.moveCategories ?? {},
  );
  const [excludedMoves, setExcludedMoves] = useState(
    playset.excludes?.moves ?? {},
  );
  const { replacedMoveCollections, replacedMoves } = useMemo(() => {
    const { replacedCollections, replacedItems } =
      getReplacedCollectionsAndItemsFromExpansions(
        tree,
        "moves",
        excludedMoveCollections,
        excludedMoves,
      );
    return {
      replacedMoveCollections: replacedCollections,
      replacedMoves: replacedItems,
    };
  }, [tree, excludedMoveCollections, excludedMoves]);

  const [excludedOracleCollections, setExcludedOracleCollections] = useState(
    playset.excludes?.oracleCategories ?? {},
  );
  const [excludedOracles, setExcludedOracles] = useState(
    playset.excludes?.oracles ?? {},
  );
  const { replacedOracleCollections, replacedOracles } = useMemo(() => {
    const { replacedCollections, replacedItems } =
      getReplacedCollectionsAndItemsFromExpansions(
        tree,
        "oracles",
        excludedOracleCollections,
        excludedOracles,
      );
    return {
      replacedOracleCollections: replacedCollections,
      replacedOracles: replacedItems,
    };
  }, [tree, excludedOracleCollections, excludedOracles]);

  return (
    <>
      <DialogContent>
        <Alert severity="info">
          {t(
            "playset-editor.exclusions-info",
            "Checked assets, moves, and oracles will be included in your game.",
          )}
        </Alert>

        {showCursedDieOptions && (
          <Box mt={1}>
            <FormControlLabel
              disableTypography
              label={
                <Box>
                  <Typography>
                    {t(
                      "playset-editor.cursed-die",
                      "Automatically Roll Cursed Die?",
                    )}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {t(
                      "playset-editor.cursed-die-info",
                      "If checked, the a cursed die will be rolled for oracles with a cursed alternative automatically.",
                    )}
                  </Typography>
                </Box>
              }
              onChange={(_, checked) =>
                setDisableAutomaticCursedDieRolls(!checked)
              }
              control={<Checkbox checked={!disableAutomaticCursedDieRolls} />}
            />
          </Box>
        )}

        <Box mt={1}>
          <PlaysetSection
            label={t("playset-editor.assets", "Assets")}
            rulesPackages={tree}
            collectionKey="assets"
            excludedCollections={excludedAssetCollections}
            toggleExcludedCollection={(collectionId, isExcluded) => {
              setExcludedAssetCollections((prev) => ({
                ...prev,
                [collectionId]: isExcluded,
              }));
            }}
            excludedItems={excludedAssets}
            toggleExcludedItem={(itemId, isExcluded) => {
              setExcludedAssets((prev) => ({
                ...prev,
                [itemId]: isExcluded,
              }));
            }}
            replacedCollections={replacedAssetCollections}
            replacedItems={replacedAssets}
          />
          <PlaysetSection
            label={t("playset-editor.moves", "Moves")}
            rulesPackages={tree}
            collectionKey="moves"
            excludedCollections={excludedMoveCollections}
            toggleExcludedCollection={(collectionId, isExcluded) => {
              setExcludedMoveCollections((prev) => ({
                ...prev,
                [collectionId]: isExcluded,
              }));
            }}
            excludedItems={excludedMoves}
            toggleExcludedItem={(itemId, isExcluded) => {
              setExcludedMoves((prev) => ({
                ...prev,
                [itemId]: isExcluded,
              }));
            }}
            replacedCollections={replacedMoveCollections}
            replacedItems={replacedMoves}
          />
          <PlaysetSection
            label={t("playset-editor.oracles", "Oracles")}
            rulesPackages={tree}
            collectionKey="oracles"
            excludedCollections={excludedOracleCollections}
            toggleExcludedCollection={(collectionId, isExcluded) => {
              setExcludedOracleCollections((prev) => ({
                ...prev,
                [collectionId]: isExcluded,
              }));
            }}
            excludedItems={excludedOracles}
            toggleExcludedItem={(itemId, isExcluded) => {
              setExcludedOracles((prev) => ({
                ...prev,
                [itemId]: isExcluded,
              }));
            }}
            replacedCollections={replacedOracleCollections}
            replacedItems={replacedOracles}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          color="primary"
          variant="contained"
          onClick={() => {
            setPlayset({
              ...playset,
              disableAutomaticCursedDieRolls,
              excludes: {
                assetCategories: excludedAssetCollections,
                assets: excludedAssets,
                moveCategories: excludedMoveCollections,
                moves: excludedMoves,
                oracleCategories: excludedOracleCollections,
                oracles: excludedOracles,
              },
            });
            onClose();
          }}
        >
          {t("common.save", "Save")}
        </Button>
      </DialogActions>
    </>
  );
}

function getReplacedCollectionsAndItemsFromExpansions(
  tree: Record<string, Datasworn.RulesPackage>,
  type: "assets" | "moves" | "oracles",
  excludedCollections: Record<string, boolean>,
  excludedItems: Record<string, boolean>,
): {
  replacedCollections: Record<string, boolean>;
  replacedItems: Record<string, boolean>;
} {
  const replacedCollections: Record<string, boolean> = {};
  const replacedItems: Record<string, boolean> = {};

  Object.values(tree).forEach((rulesPackage) => {
    if (rulesPackage.type === "expansion") {
      getReplacedCollectionsAndItemsFromCollection(
        tree,
        rulesPackage[type],
        excludedCollections,
        excludedItems,
        replacedCollections,
        replacedItems,
      );
    }
  });

  return {
    replacedCollections,
    replacedItems,
  };
}

function getReplacedCollectionsAndItemsFromCollection(
  tree: Record<string, Datasworn.RulesPackage>,
  collections: Record<
    string,
    | Datasworn.AssetCollection
    | Datasworn.MoveCategory
    | Datasworn.OracleCollection
  >,
  excludedCollections: Record<string, boolean>,
  excludedItems: Record<string, boolean>,
  replacedCollections: Record<string, boolean>,
  replacedItems: Record<string, boolean>,
) {
  Object.values(collections).forEach((collection) => {
    if (excludedCollections[collection._id]) return;

    if (collection.replaces) {
      collection.replaces.forEach((replacesKey) => {
        const collectionsToReplace = IdParser.getMatches(
          replacesKey as Primary,
          tree,
        );
        collectionsToReplace.forEach((collectionToReplace) => {
          if (
            collectionToReplace.type === collection.type &&
            !excludedCollections[collectionToReplace._id]
          ) {
            replacedCollections[collectionToReplace._id] = true;
          }
        });
      });
    } else {
      if ("collections" in collection) {
        getReplacedCollectionsAndItemsFromCollection(
          tree,
          collection.collections,
          excludedCollections,
          excludedItems,
          replacedCollections,
          replacedItems,
        );
      }
      Object.values(
        collection.contents as Record<
          string,
          Datasworn.Move | Datasworn.OracleRollable | Datasworn.Asset
        >,
      ).forEach((item) => {
        if (item.replaces && !excludedItems[item._id]) {
          item.replaces.forEach((replacesKey) => {
            const itemsToReplace = IdParser.getMatches(
              replacesKey as Primary,
              tree,
            );
            itemsToReplace.forEach((itemToReplace) => {
              if (
                !excludedItems[itemToReplace._id] &&
                itemToReplace.type === item.type
              ) {
                replacedItems[itemToReplace._id] = true;
              }
            });
          });
        }
      });
    }
  });
}
