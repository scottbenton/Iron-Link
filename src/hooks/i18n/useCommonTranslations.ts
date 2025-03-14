import { useTranslation } from "react-i18next";

export function useCommonTranslations() {
  const { t } = useTranslation("common");
  return t;
}
