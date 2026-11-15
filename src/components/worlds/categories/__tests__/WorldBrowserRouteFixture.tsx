import { useLocation, useNavigate } from "react-router";

import {
  type WorldNavigation,
  getWorldViewPath,
  parseWorldViewPath,
} from "components/worlds/worldNavigation";

import { WorldPermission } from "repositories/shared.types";

import type { IWorld } from "services/worlds.service";

import { WorldCategoryManager } from "../WorldCategoryManager";

// Renders the real manager for the world, category and entry destinations,
// read from the path as WorldPage reads it. Tests supply categories through
// their worldCategories store mock.
export function WorldBrowserRouteFixture({
  permission = WorldPermission.Viewer,
}: {
  permission?: WorldPermission;
}) {
  const parsed = parseWorldViewPath(useLocation().pathname);
  const navigate = useNavigate();
  if (!parsed) return null;
  const { worldId, view } = parsed;
  const categoryId = "categoryId" in view ? view.categoryId : undefined;
  const navigation: WorldNavigation = {
    view,
    getLinkProps: (target) => ({ href: getWorldViewPath(worldId, target) }),
    navigate: (target) => navigate(getWorldViewPath(worldId, target)),
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
