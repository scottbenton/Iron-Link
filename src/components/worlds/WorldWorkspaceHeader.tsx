import SettingsIcon from "@mui/icons-material/Settings";
import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { getWorldSettingLabel } from "lib/worldSettings";

import { IWorld } from "services/worlds.service";

export function WorldWorkspaceHeader({
  world,
  configuring,
  onConfigure,
}: {
  world: IWorld;
  configuring: boolean;
  onConfigure: () => void;
}) {
  const { t } = useTranslation();
  const settingLabel = world.settingKey
    ? getWorldSettingLabel(world.settingKey)
    : t("worlds.panel.no-setting", "No setting");
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1,
        pb: 2,
      }}
    >
      <Box sx={{ minWidth: 0, flex: "1 1 180px" }}>
        <Typography
          variant="h5"
          component="h1"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
          sx={{ overflowWrap: "anywhere" }}
        >
          {world.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {settingLabel}
        </Typography>
      </Box>
      {!configuring && (
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={onConfigure}
        >
          {t("worlds.settings.open", "Settings")}
        </Button>
      )}
    </Box>
  );
}
