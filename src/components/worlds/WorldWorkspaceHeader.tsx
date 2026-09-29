import SettingsIcon from "@mui/icons-material/Settings";
import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { IWorld } from "services/worlds.service";

import type { WorldNavigation } from "./worldNavigation";

export function WorldWorkspaceHeader({
  world,
  navigation,
}: {
  world: IWorld;
  navigation: WorldNavigation;
}) {
  const { t } = useTranslation();
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
      </Box>
      <Button
        LinkComponent={LinkComponent}
        {...navigation.getLinkProps({ type: "settings" })}
        variant="outlined"
        startIcon={<SettingsIcon />}
      >
        {t("worlds.settings.open", "Settings")}
      </Button>
    </Box>
  );
}
