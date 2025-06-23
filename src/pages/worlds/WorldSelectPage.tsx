import { useTranslation } from "react-i18next";

import { GradientButton } from "components/GradientButton";
import { GridLayout, PageContent, PageHeader } from "components/Layout";
import { LinkComponent } from "components/LinkComponent";
import { WorldCard } from "components/worlds/WorldCard";

import { pathConfig } from "pages/pathConfig";

import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useLoadUsersWorlds, useUsersWorlds } from "stores/users.worlds.store";

export default function WorldSelectPage() {
  const { t } = useTranslation();
  useSendPageViewEvent(PageCategory.WorldSelect);

  useLoadUsersWorlds();
  const worlds = useUsersWorlds((store) =>
    [...store.worlds].sort((w1, w2) => w1.name.localeCompare(w2.name)),
  );

  const loading = useUsersWorlds((store) => store.loading);
  const error = useUsersWorlds((store) => store.error);

  return (
    <>
      <PageHeader
        label={t("worlds.title", "Worlds")}
        actions={
          <GradientButton href={pathConfig.worldCreate}>
            {t("world.list.create", "Create a World")}
          </GradientButton>
        }
      />
      <PageContent>
        <GridLayout
          items={worlds}
          renderItem={(world) => (
            <WorldCard
              key={world.id}
              world={world}
              LinkComponent={LinkComponent}
              href={pathConfig.world(world.id)}
            />
          )}
          loading={loading}
          error={
            error
              ? t(
                  "world.list.error-loading-worlds",
                  "Failed to load worlds. Please try again later.",
                )
              : undefined
          }
          emptyStateMessage={t("world.list.no-worlds-found", "No worlds found")}
          emptyStateAction={
            <GradientButton href={pathConfig.worldCreate}>
              {t("world.list.create", "Create a World")}
            </GradientButton>
          }
          minWidth={300}
        />
      </PageContent>
    </>
  );
}
