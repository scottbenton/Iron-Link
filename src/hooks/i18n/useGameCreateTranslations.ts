import { useTranslation } from "react-i18next";

export function useGameCreateTranslations() {
  const { t } = useTranslation(["game-create-page", "common"]);
  return t;
}
