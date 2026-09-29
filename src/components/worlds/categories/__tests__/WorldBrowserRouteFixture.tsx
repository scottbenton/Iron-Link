import { useNavigate, useParams } from "react-router";

import { WorldBreadcrumbs } from "components/worlds/WorldBreadcrumbs";
import {
  type WorldNavigation,
  getWorldViewPath,
} from "components/worlds/worldNavigation";

import { WorldPermission } from "repositories/shared.types";

import type { IWorldCategory } from "services/worldCategories.service";
import type { IWorld } from "services/worlds.service";

import { WorldCategoryBrowser } from "../WorldCategoryBrowser";
import { category } from "./fixtures";

export function WorldBrowserRouteFixture({
  categories = [category],
  permission = WorldPermission.Viewer,
}: {
  categories?: IWorldCategory[];
  permission?: WorldPermission;
}) {
  const { worldId = "world-1", categoryId } = useParams();
  const navigate = useNavigate();
  const navigation: WorldNavigation = {
    view: categoryId ? { type: "category", categoryId } : { type: "world" },
    getLinkProps: (view) => ({ href: getWorldViewPath(worldId, view) }),
    navigate: (view) => navigate(getWorldViewPath(worldId, view)),
  };
  return (
    <>
      <WorldBreadcrumbs
        world={{ id: worldId, name: "Ironlands" } as IWorld}
        category={categories.find(
          (item) => item.worldId === worldId && item.id === categoryId,
        )}
        navigation={navigation}
        root={{
          key: "worlds",
          label: "Worlds",
          linkProps: { href: "/worlds" },
        }}
      />
      <WorldCategoryBrowser
        worldId={worldId}
        worldName="Ironlands"
        permission={permission}
        categories={categories}
        canAddCategory={false}
        onAddCategory={() => {}}
        navigation={navigation}
      />
    </>
  );
}
