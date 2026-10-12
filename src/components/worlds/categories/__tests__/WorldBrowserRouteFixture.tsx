import { useNavigate, useParams } from "react-router";

import {
  type WorldNavigation,
  getWorldViewPath,
} from "components/worlds/worldNavigation";

import { WorldPermission } from "repositories/shared.types";

import type { IWorld } from "services/worlds.service";

import { WorldCategoryManager } from "../WorldCategoryManager";

// Renders the real manager for the world, category and entry destinations. Tests
// supply categories through their worldCategories store mock.
export function WorldBrowserRouteFixture({
  permission = WorldPermission.Viewer,
}: {
  permission?: WorldPermission;
}) {
  const { worldId = "world-1", categoryId, entryId } = useParams();
  const navigate = useNavigate();
  const navigation: WorldNavigation = {
    view:
      categoryId && entryId
        ? { type: "entry", categoryId, entryId }
        : categoryId
          ? { type: "category", categoryId }
          : { type: "world" },
    getLinkProps: (view) => ({ href: getWorldViewPath(worldId, view) }),
    navigate: (view) => navigate(getWorldViewPath(worldId, view)),
  };
  return (
    <WorldCategoryManager
      key={categoryId ?? "world"}
      world={{ id: worldId, name: "Ironlands" } as IWorld}
      permission={permission}
      navigation={navigation}
      layout="page"
      rootBreadcrumb={{
        key: "worlds",
        label: "Worlds",
        linkProps: { href: "/worlds" },
      }}
      generalSettings={null}
    />
  );
}
