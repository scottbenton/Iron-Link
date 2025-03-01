import { useTranslation } from "react-i18next";

export function useCharacterCreateTranslations() {
  const { t } = useTranslation(["character-create-page", "common"]);
  return t;
}
