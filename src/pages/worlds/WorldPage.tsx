import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { PageContent, PageHeader } from "components/Layout";
import { WorldPanel } from "components/worlds/WorldPanel";

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

  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const worldsEnabled = useAdvancedFeatureToggle("worlds");

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
    // The world's heading lives inside WorldPanel (it is editable in place),
    // so this page supplies only the page container.
    <PageContent sx={{ pt: 4 }}>
      <WorldPanel
        worldId={worldId}
        onWorldDeleted={() => {
          navigate(pathConfig.worldSelect);
        }}
      />
    </PageContent>
  );
}
