import type { TFunction } from "i18next";

export interface AssetPickerStrings {
  title: string;
  searchLabel: string;
  searchPlaceholder: string;
  /** "12 results" while searching. */
  results: (count: number) => string;
  /** The line under the count: what was searched for. */
  resultsFor: (query: string) => string;
  noMatches: (query: string) => string;
  /** Read after a group's name: "12 assets". */
  assetCount: (count: number) => string;
  /** The short Add on each row. */
  add: string;
  /** The row's Add, and the main button, named for the asset. */
  addAsset: (name: string) => string;
  /** Beside the list before anything is picked. */
  pickPrompt: string;
  /** The phone's way back from a card to the list. */
  backToResults: string;
  backToAssets: string;
  cancel: string;
}

export function getDefaultAssetPickerStrings(t: TFunction): AssetPickerStrings {
  return {
    title: t("ui.asset-picker-dialog.title", "Add Asset"),
    searchLabel: t("ui.asset-picker-dialog.search", "Search assets"),
    searchPlaceholder: t(
      "ui.asset-picker-dialog.search-placeholder",
      "Search by name or ability",
    ),
    results: (count) =>
      t("ui.asset-picker-dialog.results", "{{count}} results", {
        count,
        defaultValue_one: "{{count}} result",
      }),
    resultsFor: (query) =>
      t(
        "ui.asset-picker-dialog.results-for",
        "For “{{query}}” across every type",
        {
          query,
        },
      ),
    noMatches: (query) =>
      t("ui.asset-picker-dialog.no-matches", "No assets match “{{query}}”.", {
        query,
      }),
    assetCount: (count) =>
      t("ui.asset-picker-dialog.asset-count", "{{count}} assets", {
        count,
        defaultValue_one: "{{count}} asset",
      }),
    add: t("ui.asset-picker-dialog.add", "Add"),
    addAsset: (name) =>
      t("ui.asset-picker-dialog.add-asset", "Add {{name}}", { name }),
    pickPrompt: t(
      "ui.asset-picker-dialog.pick-prompt",
      "Pick an asset to read its card.",
    ),
    backToResults: t("ui.asset-picker-dialog.back-to-results", "Results"),
    backToAssets: t("ui.asset-picker-dialog.back-to-assets", "Assets"),
    cancel: t("ui.common.cancel", "Cancel"),
  };
}
