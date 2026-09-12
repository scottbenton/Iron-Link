import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { PageContent, PageHeader } from "components/Layout";
import { CreateWorldForm } from "components/worlds/CreateWorldForm";

import { pathConfig } from "pages/pathConfig";
import { WorldsComingSoonState } from "pages/worlds/WorldsComingSoonState";

import { useAdvancedFeatureToggle } from "hooks/advancedFeatures/advancedFeatures";
import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useUID } from "stores/auth.store";

export default function CreateWorldPage() {
  const { t } = useTranslation();
  useSendPageViewEvent(PageCategory.WorldCreate);

  const navigate = useNavigate();
  const uid = useUID();
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

  if (!uid) {
    return null;
  }

  return (
    <>
      <PageHeader
        label={t("worlds.create.new-world", "New World")}
        maxWidth="md"
      />
      <PageContent maxWidth="md">
        <CreateWorldForm
          onCreated={(worldId) => {
            navigate(pathConfig.world(worldId));
          }}
          onCancel={() => {
            navigate(pathConfig.worldSelect);
          }}
        />
      </PageContent>
    </>
  );
}
