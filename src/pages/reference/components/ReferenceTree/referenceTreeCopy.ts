import { TFunction } from "i18next";

// What a screen reader hears after a category's name, from its count.
export function getMoveCountLabel(t: TFunction) {
  return (count: number) =>
    t("reference.tree.move-count", "{{count}} moves", {
      count,
      defaultValue_one: "1 move",
    });
}

export function getOracleCountLabel(t: TFunction) {
  return (count: number) =>
    t("reference.tree.oracle-count", "{{count}} oracles", {
      count,
      defaultValue_one: "1 oracle",
    });
}
