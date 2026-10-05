import { Box, Card, CardActionArea, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { pathConfig } from "pages/pathConfig";

import { IUsersWorld } from "services/worlds.service";

import { useWorldRulesetNames } from "./useWorldRulesetNames";

export interface WorldCardProps {
  worldId: string;
  world: IUsersWorld;
}

export function WorldCard(props: WorldCardProps) {
  const { worldId, world } = props;

  const { t } = useTranslation();

  const rules = useWorldRulesetNames(worldId, world.settingKey);

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardActionArea
        LinkComponent={LinkComponent}
        href={pathConfig.world(worldId)}
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontFamily={(theme) => theme.typography.fontFamilyTitle}
            textTransform="uppercase"
          >
            {world.name}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {rules
              ? rules.error
                ? t("worlds.list.rules-error", "Rules unavailable")
                : rules.names.length
                  ? t(
                      rules.source === "games"
                        ? "worlds.list.game-rules"
                        : "worlds.list.setting-rules",
                      rules.source === "games"
                        ? "Game rules: {{names}}"
                        : "Setting rules: {{names}}",
                      { names: rules.names.join(" · ") },
                    )
                  : rules.source === "games"
                    ? t("worlds.list.no-game-rules", "No game rules")
                    : t("worlds.list.no-setting-rules", "No setting rules")
              : t("worlds.list.loading-rules", "Loading rules…")}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
}
