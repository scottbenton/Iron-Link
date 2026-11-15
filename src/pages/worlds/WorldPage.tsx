import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";

import { PageContent, PageHeader } from "components/Layout";
import { WorldPanel } from "components/worlds/WorldPanel";
import {
  type ParsedWorldViewPath,
  type WorldNavigation,
  getWorldViewPath,
  parseWorldViewPath,
} from "components/worlds/worldNavigation";

import { Page404 } from "pages/404Page/404Page";
import { pathConfig } from "pages/pathConfig";

import { useAdvancedFeatureToggle } from "hooks/advancedFeatures/advancedFeatures";
import { useDocumentTitle } from "hooks/useDocumentTitle";
import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useWorldStore } from "stores/world.store";

import { WorldsComingSoonState } from "./WorldsComingSoonState";

// One catchall route renders every world destination; the path is read only
// by parseWorldViewPath, and one it does not know is a 404.
export default function WorldPage() {
  const parsed = parseWorldViewPath(useLocation().pathname);
  return parsed ? <WorldPageContent parsed={parsed} /> : <Page404 />;
}

function WorldPageContent(props: { parsed: ParsedWorldViewPath }) {
  const { parsed } = props;
  const { worldId } = parsed;
  const { t } = useTranslation();
  useSendPageViewEvent(PageCategory.World);

  const navigate = useNavigate();
  const worldsEnabled = useAdvancedFeatureToggle("worlds");
  const worldName = useWorldStore((store) =>
    store.worldId === worldId ? store.world?.name : undefined,
  );
  useDocumentTitle(worldsEnabled ? worldName : t("worlds.title", "Worlds"));

  const navigation: WorldNavigation = {
    view: parsed.view,
    getLinkProps: (target) => ({
      href: getWorldViewPath(worldId, target),
    }),
    navigate: (target) => navigate(getWorldViewPath(worldId, target)),
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
