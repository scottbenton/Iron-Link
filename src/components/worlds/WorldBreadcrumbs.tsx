import { useTranslation } from "react-i18next";

import {
  type BreadcrumbItem,
  BreadcrumbTrail,
} from "components/Layout/BreadcrumbTrail";

import type { IWorldCategory } from "services/worldCategories.service";
import type { IWorldEntry } from "services/worldEntries.service";
import type { IWorld } from "services/worlds.service";

import type { WorldNavigation } from "./worldNavigation";

export function WorldBreadcrumbs({
  world,
  category,
  navigation,
  root,
  categoryLoading,
  entry,
  entryLoading,
  ancestors = [],
}: {
  world: IWorld;
  category?: IWorldCategory;
  navigation: WorldNavigation;
  root: BreadcrumbItem;
  categoryLoading?: boolean;
  entry?: IWorldEntry;
  entryLoading?: boolean;
  // The entry's visible ancestors, outermost first; each opens its Places.
  ancestors?: IWorldEntry[];
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
  if (
    view.type === "category" ||
    view.type === "category-settings" ||
    view.type === "entry"
  ) {
    items.push({
      key: "category",
      label:
        category?.name ??
        (categoryLoading
          ? t("worlds.category.loading", "Loading category…")
          : t("worlds.category.missing", "Category unavailable")),
      linkProps:
        view.type === "category-settings" || view.type === "entry"
          ? navigation.getLinkProps({
              type: "category",
              categoryId: view.categoryId,
            })
          : undefined,
    });
  }
  if (view.type === "entry") {
    ancestors.forEach((ancestor) =>
      items.push({
        key: `ancestor-${ancestor.id}`,
        label: ancestor.name,
        linkProps: navigation.getLinkProps({
          type: "entry",
          categoryId: view.categoryId,
          entryId: ancestor.id,
          section: "places",
        }),
      }),
    );
    items.push({
      key: "entry",
      label:
        entry?.name ??
        (entryLoading
          ? t("worlds.entries.loading", "Loading entry…")
          : t("worlds.entries.missing", "Entry unavailable")),
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
