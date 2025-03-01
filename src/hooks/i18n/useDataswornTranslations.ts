import { useTranslation } from "react-i18next";

export function useDataswornTranslations() {
  const { t } = useTranslation(["datasworn", "common"]);
  return t;
}
