import { useTranslation } from "react-i18next";

export function useGameSelectTranslations() {
  const { t } = useTranslation(["game-select", "common"]);
  return t;
}
