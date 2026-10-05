import { useTranslation } from "react-i18next";

import {
  type BreadcrumbItem,
  BreadcrumbTrail,
} from "components/Layout/BreadcrumbTrail";

import type { IWorldCategory } from "services/worldCategories.service";
import type { IWorld } from "services/worlds.service";

import type { WorldNavigation } from "./worldNavigation";

export function WorldBreadcrumbs({
  world,
  category,
  navigation,
  root,
  categoryLoading,
}: {
  world: IWorld;
  category?: IWorldCategory;
  navigation: WorldNavigation;
  root: BreadcrumbItem;
  categoryLoading?: boolean;
}) {
  const { t } = useTranslation();
  const view = navigation.view;
  const items: BreadcrumbItem[] = [
    root,
    {
      key: "world",
      label: world.name,
      linkProps:
        view.type === "world"
          ? undefined
          : navigation.getLinkProps({ type: "world" }),
    },
  ];
  if (view.type === "category" || view.type === "category-settings") {
    items.push({
      key: "category",
      label:
        category?.name ??
        (categoryLoading
          ? t("worlds.category.loading", "Loading category…")
          : t("worlds.category.missing", "Category unavailable")),
      linkProps:
        view.type === "category-settings"
          ? navigation.getLinkProps({
              type: "category",
              categoryId: view.categoryId,
            })
          : undefined,
    });
  }
  if (view.type === "settings" || view.type === "category-settings") {
    items.push({
      key: "settings",
      label: t("worlds.settings.open", "Settings"),
    });
  }
  return <BreadcrumbTrail items={items} />;
}
