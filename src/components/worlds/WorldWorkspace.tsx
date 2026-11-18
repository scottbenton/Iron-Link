import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { BreadcrumbItem } from "components/Layout/BreadcrumbTrail";

import { pathConfig } from "pages/pathConfig";

import { WorldPermission } from "repositories/shared.types";

import { IWorld } from "services/worlds.service";

import { WorldGeneralSettings } from "./WorldGeneralSettings";
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
  return (
    <WorldCategoryManager
      world={world}
      permission={permission}
      navigation={navigation}
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
  );
}
