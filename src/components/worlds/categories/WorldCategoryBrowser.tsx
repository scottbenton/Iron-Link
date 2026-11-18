import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";

import { GridLayout } from "components/Layout";
import { EmptyState } from "components/Layout/EmptyState";
import { LinkComponent } from "components/LinkComponent";

import { IWorldCategory } from "services/worldCategories.service";

import { WorldTruthsFolder } from "../truths/WorldTruthsFolder";
import { useWorldTruthsCard } from "../truths/useWorldTruthsCard";
import type { WorldNavigation } from "../worldNavigation";
import { WorldCategoryFolder } from "./WorldCategoryFolder";

export function WorldCategoryBrowser({
  categories,
  missingCategory,
  worldId,
  worldName,
  settingKey,
  navigation,
}: {
  categories: IWorldCategory[];
  missingCategory: boolean;
  worldId: string;
  worldName: string;
  settingKey: string | null;
  navigation: WorldNavigation;
}) {
  const { t } = useTranslation();
  const truthsCard = useWorldTruthsCard(worldId, settingKey);
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
        items={truthsCard ? [truthsCard, ...categories] : categories}
        minWidth={200}
        gap={1}
        renderItem={(item) =>
          "truths" in item ? (
            <WorldTruthsFolder
              linkProps={navigation.getLinkProps({ type: "truths" })}
              subtitle={item.subtitle}
            />
          ) : (
            <WorldCategoryFolder
              category={item}
              linkProps={navigation.getLinkProps({
                type: "category",
                categoryId: item.id,
              })}
            />
          )
        }
        emptyStateMessage={t(
          "worlds.categories.empty-state",
          "This world has no categories yet.",
        )}
      />
    </section>
  );
}
