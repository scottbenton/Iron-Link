import { useTranslation } from "react-i18next";

export function useLayoutTranslations() {
  const { t } = useTranslation(["layout", "common"]);
  return t;
}
