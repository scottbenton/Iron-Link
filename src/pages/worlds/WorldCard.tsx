import { Card, CardActionArea, Chip, Typography } from "@mui/material";

import { LinkComponent } from "components/LinkComponent";

import { pathConfig } from "pages/pathConfig";

import { IWorld } from "services/worlds.service";

import { getWorldSettingLabel } from "./hooks/useWorldSettings";

export interface WorldCardProps {
  worldId: string;
  world: IWorld;
}

export function WorldCard(props: WorldCardProps) {
  const { worldId, world } = props;

  const settingLabel = getWorldSettingLabel(world.settingKey);

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
          height: "100%",
          justifyContent: "flex-start",
        }}
      >
        <Typography variant="h6" component="p" fontFamily="fontFamilyTitle">
          {world.name}
        </Typography>
        {world.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {world.description}
          </Typography>
        )}
        {settingLabel && (
          <Chip size="small" label={settingLabel} sx={{ mt: 1 }} />
        )}
      </CardActionArea>
    </Card>
  );
}
