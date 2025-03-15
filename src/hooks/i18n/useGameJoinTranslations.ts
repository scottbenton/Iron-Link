import { useTranslation } from "react-i18next";

export function useGameJoinTranslations() {
  const { t } = useTranslation(["game-join-page", "common"]);
  return t;
}
