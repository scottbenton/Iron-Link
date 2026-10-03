import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { BreadcrumbItem } from "components/Layout/BreadcrumbTrail";

import { pathConfig } from "pages/pathConfig";

import { WorldPermission } from "repositories/shared.types";

import { IWorld } from "services/worlds.service";

import { WorldGeneralSettings } from "./WorldGeneralSettings";
import { WorldOracleContextProvider } from "./WorldOracleContextProvider";
import type { WorldLayout } from "./WorldViewLayout";
import { WorldCategoryManager } from "./categories/WorldCategoryManager";
import type { WorldNavigation } from "./worldNavigation";

export function WorldWorkspace({
  world,
  permission,
  onWorldDeleted,
  additionalSettings,
  navigation,
  rootBreadcrumb,
  layout,
}: {
  world: IWorld;
  permission: WorldPermission | null;
  onWorldDeleted?: () => void;
  additionalSettings?: ReactNode;
  navigation: WorldNavigation;
  rootBreadcrumb?: BreadcrumbItem;
  layout: WorldLayout;
}) {
  const { t } = useTranslation();
  const categoryId =
    "categoryId" in navigation.view ? navigation.view.categoryId : undefined;
  return (
    <WorldOracleContextProvider worldId={world.id}>
      <WorldCategoryManager
        key={`${navigation.view.type}:${categoryId ?? ""}`}
        world={world}
        permission={permission}
        navigation={navigation}
        layout={layout}
        rootBreadcrumb={
          rootBreadcrumb ?? {
            key: "worlds",
            label: t("worlds.title", "Worlds"),
            linkProps: { href: pathConfig.worldSelect },
          }
        }
        generalSettings={
          <WorldGeneralSettings
            world={world}
            permission={permission}
            onWorldDeleted={onWorldDeleted}
            additionalSettings={additionalSettings}
          />
        }
      />
    </WorldOracleContextProvider>
  );
}
