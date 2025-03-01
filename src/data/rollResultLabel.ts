import i18next from "i18next";
import { RollResult } from "@/repositories/shared.types";

export function getRollResultLabel(result: RollResult) {
  let resultLabel = i18next.t("datasworn.weak-hit", "Weak Hit");
  if (result === RollResult.StrongHit) {
    resultLabel = i18next.t("datasworn.strong-hit", "Strong Hit");
  } else if (result === RollResult.Miss) {
    resultLabel = i18next.t("datasworn.miss", "Miss");
  }
  return resultLabel;
}
