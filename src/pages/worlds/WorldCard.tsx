import { Box, Card, CardActionArea, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { pathConfig } from "pages/pathConfig";

import { getWorldSettingLabel } from "lib/worldSettings";

import { IUsersWorld } from "services/worlds.service";

export interface WorldCardProps {
  worldId: string;
  world: IUsersWorld;
}

export function WorldCard(props: WorldCardProps) {
  const { worldId, world } = props;

  const { t } = useTranslation();

  const settingLabel = world.settingKey
    ? getWorldSettingLabel(world.settingKey)
    : t("worlds.list.no-setting", "No setting");

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
          <Typography
            color="text.secondary"
            fontFamily={(theme) => theme.typography.fontFamilyTitle}
            textTransform="uppercase"
          >
            {settingLabel}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
}
