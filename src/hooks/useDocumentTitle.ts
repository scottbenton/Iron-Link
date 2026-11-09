import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// "Ironlands | Iron Link", or just the app's name without a page title.
export function formatDocumentTitle(
  pageTitle: string | null | undefined,
  appName: string,
) {
  const trimmed = pageTitle?.trim();
  return trimmed ? `${trimmed} | ${appName}` : appName;
}

// Names the browser tab (and what a screen reader reads for the page) after
// the page. Pages render one at a time, so the last page to mount owns the
// title; leaving it puts back the app's name. Pass nothing while the name is
// loading.
export function useDocumentTitle(pageTitle?: string | null) {
  const { t } = useTranslation();
  const appName = t("iron-link.title", "Iron Link");

  useEffect(() => {
    document.title = formatDocumentTitle(pageTitle, appName);
  }, [pageTitle, appName]);

  useEffect(() => {
    return () => {
      document.title = appName;
    };
  }, [appName]);
}
