import { Box } from "@mui/material";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { BreadcrumbItem } from "components/Layout/BreadcrumbTrail";

import { pathConfig } from "pages/pathConfig";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

import { WorldPermission } from "repositories/shared.types";

import { IWorld } from "services/worlds.service";

import { WorldBreadcrumbs } from "./WorldBreadcrumbs";
import { WorldGeneralSettings } from "./WorldGeneralSettings";
import { WorldOracleContextProvider } from "./WorldOracleContextProvider";
import { WorldWorkspaceHeader } from "./WorldWorkspaceHeader";
import { WorldCategoryManager } from "./categories/WorldCategoryManager";
import type { WorldNavigation } from "./worldNavigation";

export function WorldWorkspace({
  world,
  permission,
  onWorldDeleted,
  additionalSettings,
  navigation,
  rootBreadcrumb,
}: {
  world: IWorld;
  permission: WorldPermission | null;
  onWorldDeleted?: () => void;
  additionalSettings?: ReactNode;
  navigation: WorldNavigation;
  rootBreadcrumb?: BreadcrumbItem;
}) {
  const { t } = useTranslation();
  const categoryId =
    "categoryId" in navigation.view ? navigation.view.categoryId : undefined;
  const category = useWorldCategoriesStore((store) =>
    categoryId ? store.categories[categoryId] : undefined,
  );
  const categoriesLoading = useWorldCategoriesStore((store) => store.loading);
  return (
    <WorldOracleContextProvider worldId={world.id}>
      <Box>
        <WorldBreadcrumbs
          world={world}
          category={category?.worldId === world.id ? category : undefined}
          categoryLoading={categoriesLoading}
          navigation={navigation}
          root={
            rootBreadcrumb ?? {
              key: "worlds",
              label: t("worlds.title", "Worlds"),
              linkProps: { href: pathConfig.worldSelect },
            }
          }
        />
        {navigation.view.type === "world" && (
          <WorldWorkspaceHeader world={world} navigation={navigation} />
        )}
        <WorldCategoryManager
          key={`${navigation.view.type}:${categoryId ?? ""}`}
          worldId={world.id}
          worldName={world.name}
          permission={permission}
          navigation={navigation}
          generalSettings={
            <WorldGeneralSettings
              world={world}
              permission={permission}
              onWorldDeleted={onWorldDeleted}
              additionalSettings={additionalSettings}
            />
          }
        />
      </Box>
    </WorldOracleContextProvider>
  );
}
