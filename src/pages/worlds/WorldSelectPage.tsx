import { useTranslation } from "react-i18next";

import { PageContent, PageHeader } from "components/Layout";
import { EmptyState } from "components/Layout/EmptyState";

import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

export default function WorldSelectPage() {
  const { t } = useTranslation();
  useSendPageViewEvent(PageCategory.WorldSelect);

  return (
    <>
      <PageHeader label={t("worlds.title", "Worlds")} />
      <PageContent>
        <EmptyState
          title={t("worlds.emptyState.title", "Coming Soon!")}
          message={t(
            "worlds.emptyState.description",
            "Worlds are not yet available in the beta version.",
          )}
        />
      </PageContent>
    </>
  );
}
