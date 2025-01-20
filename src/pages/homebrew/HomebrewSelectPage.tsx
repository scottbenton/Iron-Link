import { useTranslation } from "react-i18next";

import { PageContent, PageHeader } from "components/Layout";
import { EmptyState } from "components/Layout/EmptyState";

export default function HomebrewSelectPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader label={t("homebrew.title", "Homebrew")} />
      <PageContent>
        <EmptyState
          title={t("homebrew.emptyState.title", "Coming Soon!")}
          message={t(
            "homebrew.emptyState.description",
            "Homebrew is not yet available in the beta version.",
          )}
        />
      </PageContent>
    </>
  );
}
