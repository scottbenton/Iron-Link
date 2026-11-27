import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { Button } from "ui/components/Button";
import { EmptyState, PageContent } from "ui/layout";

import { pathConfig } from "pages/pathConfig";

import { useDocumentTitle } from "hooks/useDocumentTitle";

export function Page404() {
  const { t } = useTranslation();
  const title = t("404.title", "Page Not Found");
  useDocumentTitle(title);

  return (
    <PageContent>
      <EmptyState
        title={title}
        titleAs="h1"
        message={t(
          "404.description",
          "Sorry, the page you are looking for does not exist.",
        )}
        action={
          <Button
            variant="gradient"
            nativeButton={false}
            render={<LinkComponent href={pathConfig.gameSelect} />}
          >
            {t("404.back-to-games", "Back to Games")}
          </Button>
        }
      />
    </PageContent>
  );
}
