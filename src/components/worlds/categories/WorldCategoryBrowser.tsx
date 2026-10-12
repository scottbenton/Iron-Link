import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";

import { GridLayout } from "components/Layout";
import { EmptyState } from "components/Layout/EmptyState";
import { LinkComponent } from "components/LinkComponent";

import { IWorldCategory } from "services/worldCategories.service";

import type { WorldNavigation } from "../worldNavigation";
import { WorldCategoryFolder } from "./WorldCategoryFolder";

export function WorldCategoryBrowser({
  categories,
  missingCategory,
  worldName,
  navigation,
}: {
  categories: IWorldCategory[];
  missingCategory: boolean;
  worldName: string;
  navigation: WorldNavigation;
}) {
  const { t } = useTranslation();
  if (missingCategory)
    return (
      <EmptyState
        title={t("worlds.category.missing", "Category unavailable")}
        message={t(
          "worlds.categories.not-found",
          "This category is no longer available.",
        )}
        action={
          <Button
            LinkComponent={LinkComponent}
            {...navigation.getLinkProps({ type: "world" })}
          >
            {t("worlds.categories.back", "Back to world")}
          </Button>
        }
        sx={{ py: 4 }}
      />
    );
  return (
    <section
      aria-label={t("worlds.categories.browser", "{{name}} categories", {
        name: worldName,
      })}
    >
      <GridLayout
        items={categories}
        minWidth={200}
        gap={1}
        renderItem={(category) => (
          <WorldCategoryFolder
            category={category}
            linkProps={navigation.getLinkProps({
              type: "category",
              categoryId: category.id,
            })}
          />
        )}
        emptyStateMessage={t(
          "worlds.categories.empty-state",
          "This world has no categories yet.",
        )}
      />
    </section>
  );
}
