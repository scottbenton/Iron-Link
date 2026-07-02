import { useTranslation } from "react-i18next";

import { GradientButton } from "components/GradientButton";
import { PageContent, PageHeader } from "components/Layout";
import { GridLayout } from "components/Layout/GridLayout";

import { pathConfig } from "pages/pathConfig";

import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useLoadUsersWorlds, useUsersWorlds } from "stores/users.worlds.store";

import { WorldCard } from "./WorldCard";

export default function WorldSelectPage() {
  const { t } = useTranslation();
  useSendPageViewEvent(PageCategory.WorldSelect);

  useLoadUsersWorlds();
  const worldState = useUsersWorlds();

  return (
    <>
      <PageHeader
        label={t("worlds.list.header", "Your Worlds")}
        actions={
          <GradientButton href={pathConfig.worldCreate}>
            {t("worlds.list.create", "Create World")}
          </GradientButton>
        }
      />
      <PageContent>
        <GridLayout
          items={Object.entries(worldState.worlds)}
          renderItem={([worldId, world]) => (
            <WorldCard worldId={worldId} world={world} />
          )}
          loading={worldState.loading}
          error={
            worldState.error
              ? t(
                  "worlds.list.error-loading-worlds",
                  "Failed to load your worlds. Please try again later.",
                )
              : undefined
          }
          emptyStateMessage={t(
            "worlds.list.no-worlds-found",
            "No worlds found",
          )}
          emptyStateAction={
            <GradientButton href={pathConfig.worldCreate}>
              {t("worlds.list.create", "Create World")}
            </GradientButton>
          }
          minWidth={300}
        />
      </PageContent>
    </>
  );
}
