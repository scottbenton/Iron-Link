import { useTranslation } from "react-i18next";

export function useGameTranslations() {
  const { t } = useTranslation(["game-page", "common"]);
  return t;
}
