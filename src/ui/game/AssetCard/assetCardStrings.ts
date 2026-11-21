import type { TFunction } from "i18next";

export interface AssetCardStrings {
  shared: string;
  outOfUse: (marks: string[]) => string;
  expand: string;
  collapse: string;
  rollLabel: string;
}

export function getDefaultAssetCardStrings(t: TFunction): AssetCardStrings {
  return {
    shared: t("ui.asset-card.shared", "Shared asset"),
    outOfUse: (marks) =>
      t("ui.asset-card.out-of-use", "{{marks}}: this asset is out of use", {
        marks: marks.join(", "),
      }),
    expand: t("ui.asset-card.expand", "Show all abilities"),
    collapse: t("ui.asset-card.collapse", "Hide unchecked abilities"),
    rollLabel: t("ui.asset-card.roll", "Roll"),
  };
}
