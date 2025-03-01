import { useTranslation } from "react-i18next";

export function useAuthTranslations() {
  const { t } = useTranslation(["auth-page", "common"]);
  return t;
}
