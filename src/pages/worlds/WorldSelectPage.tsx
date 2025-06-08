import { Card, CardActionArea, Typography } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { GradientButton } from "components/GradientButton";
import { GridLayout, PageContent, PageHeader } from "components/Layout";
import { LinkComponent } from "components/LinkComponent";

import { pathConfig } from "pages/pathConfig";

import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useLoadUsersWorlds, useUsersWorlds } from "stores/users.worlds.store";

import {
  defaultBaseRulesets,
  defaultExpansions,
} from "data/datasworn.packages";

import { IWorld } from "services/worlds.service";

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
          renderItem={(world) => <WorldCard key={world.id} world={world} />}
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

function WorldCard(props: { world: IWorld }) {
  const { world } = props;

  const { rulesets, expansions } = world;

  const rulesPackageString = useMemo(() => {
    const packageNames: string[] = [];

    Object.entries(rulesets).forEach(([rulesetId, isRulesetActive]) => {
      if (isRulesetActive) {
        const ruleset = defaultBaseRulesets[rulesetId];
        packageNames.push(ruleset.title);

        Object.entries(expansions[rulesetId] ?? {}).forEach(
          ([expansionId, isExpansionActive]) => {
            if (isExpansionActive) {
              const expansion = defaultExpansions[rulesetId]?.[expansionId];
              packageNames.push(expansion.title);
            }
          },
        );
      }
    });

    return packageNames.join(", ");
  }, [rulesets, expansions]);

  return (
    <Card variant="outlined">
      <CardActionArea
        LinkComponent={LinkComponent}
        href={pathConfig.world(world.id)}
        sx={{
          p: 2,
        }}
      >
        <Typography
          variant="h6"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
          textTransform="uppercase"
        >
          {world.name}
        </Typography>
        <Typography
          color="text.secondary"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
          textTransform="uppercase"
        >
          {rulesPackageString}
        </Typography>
      </CardActionArea>
    </Card>
  );
}
