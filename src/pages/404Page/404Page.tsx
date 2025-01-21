import { useTranslation } from "react-i18next";

import { GradientButton } from "components/GradientButton";
import { PageContent } from "components/Layout";
import { EmptyState } from "components/Layout/EmptyState";

import { pathConfig } from "pages/pathConfig";

export function Page404() {
  const { t } = useTranslation();

  return (
    <PageContent sx={{ pt: 4 }}>
      <EmptyState
        title={t("404.title", "Page Not Found")}
        message={t(
          "404.description",
          "Sorry, the page you are looking for does not exist.",
        )}
        action={
          <GradientButton href={pathConfig.gameSelect}>
            {t("404.back-to-games", "Back to Games")}
          </GradientButton>
        }
      />
    </PageContent>
  );
}
