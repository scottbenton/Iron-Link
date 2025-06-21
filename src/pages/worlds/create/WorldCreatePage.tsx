import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { PageContent, PageHeader } from "components/Layout";

import { pathConfig } from "pages/pathConfig";

import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { WorldCreateForm } from "./WorldCreateForm";

export default function WorldCreatePage() {
  useSendPageViewEvent(PageCategory.WorldCreate);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleNavigate = useCallback(
    (worldId: string) => {
      navigate(pathConfig.world(worldId));
    },
    [navigate],
  );

  return (
    <>
      <PageHeader
        maxWidth="sm"
        label={t("worlds.title-create", "Create a World")}
      />
      <PageContent maxWidth="sm">
        <WorldCreateForm onWorldCreated={handleNavigate} />
      </PageContent>
    </>
  );
}
