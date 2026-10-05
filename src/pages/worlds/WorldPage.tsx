import { useTranslation } from "react-i18next";
import { matchPath, useLocation, useNavigate, useParams } from "react-router";

import { PageContent, PageHeader } from "components/Layout";
import { WorldPanel } from "components/worlds/WorldPanel";
import {
  type WorldNavigation,
  type WorldView,
  getWorldViewPath,
} from "components/worlds/worldNavigation";

import { Page404 } from "pages/404Page/404Page";
import { pathConfig } from "pages/pathConfig";

import { useAdvancedFeatureToggle } from "hooks/advancedFeatures/advancedFeatures";
import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { WorldsComingSoonState } from "./WorldsComingSoonState";

export default function WorldPage() {
  const { t } = useTranslation();
  useSendPageViewEvent(PageCategory.World);

  const { worldId, categoryId } = useParams<{
    worldId: string;
    categoryId: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const worldsEnabled = useAdvancedFeatureToggle("worlds");
  const settings =
    !!matchPath("/worlds/:worldId/settings/*", location.pathname) ||
    !!matchPath("/worlds/:worldId/settings", location.pathname);
  const view: WorldView = categoryId
    ? { type: settings ? "category-settings" : "category", categoryId }
    : { type: settings ? "settings" : "world" };
  const navigation: WorldNavigation = {
    view,
    getLinkProps: (target) => ({
      href: getWorldViewPath(worldId ?? "", target),
    }),
    navigate: (target) => navigate(getWorldViewPath(worldId ?? "", target)),
  };

  if (!worldsEnabled) {
    return (
      <>
        <PageHeader label={t("worlds.title", "Worlds")} />
        <PageContent>
          <WorldsComingSoonState />
        </PageContent>
      </>
    );
  }

  if (!worldId) {
    return <Page404 />;
  }

  return (
    // Destination state belongs to the URL; the shared panel also renders
    // these destinations as independent Notes tabs inside a game.
    <PageContent sx={{ pt: 4 }}>
      <WorldPanel
        worldId={worldId}
        navigation={navigation}
        onWorldDeleted={() => {
          navigate(pathConfig.worldSelect);
        }}
      />
    </PageContent>
  );
}
