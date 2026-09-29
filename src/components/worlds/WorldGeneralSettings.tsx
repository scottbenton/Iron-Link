import { Box, Divider, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { getWorldSettingLabel } from "lib/worldSettings";

import { WorldPermission } from "repositories/shared.types";

import { IWorld } from "services/worlds.service";

import { DeleteWorldButton } from "./DeleteWorldButton";
import { WorldNameField } from "./WorldNameField";

export function WorldGeneralSettings({
  world,
  permission,
  onWorldDeleted,
  additionalSettings,
}: {
  world: IWorld;
  permission: WorldPermission | null;
  onWorldDeleted?: () => void;
  additionalSettings?: ReactNode;
}) {
  const { t } = useTranslation();
  const canRename =
    permission === WorldPermission.Owner ||
    permission === WorldPermission.Editor;
  return (
    <Stack spacing={3}>
      <Typography
        variant="h6"
        component="h3"
        sx={{ fontFamily: (theme) => theme.typography.fontFamilyTitle }}
      >
        {t("worlds.settings.general", "General")}
      </Typography>
      <Box>
        {canRename ? (
          <>
            <WorldNameField
              key={world.id}
              worldId={world.id}
              name={world.name}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t(
                "worlds.settings.name-help",
                "Name changes save automatically. A world name cannot be blank.",
              )}
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="subtitle2">
              {t("worlds.panel.world-name", "World Name")}
            </Typography>
            <Typography sx={{ overflowWrap: "anywhere" }}>
              {world.name}
            </Typography>
          </>
        )}
      </Box>
      <Box>
        <Typography variant="subtitle2">
          {t("worlds.settings.setting", "Setting")}
        </Typography>
        <Typography>
          {world.settingKey
            ? getWorldSettingLabel(world.settingKey)
            : t("worlds.panel.no-setting", "No setting")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t(
            "worlds.settings.setting-help",
            "The setting is chosen when the world is created.",
          )}
        </Typography>
      </Box>
      {additionalSettings && (
        <>
          <Divider />
          {additionalSettings}
        </>
      )}
      {permission === WorldPermission.Owner && (
        <>
          <Divider />
          <Box>
            <Typography
              variant="h6"
              component="h3"
              sx={{ fontFamily: (theme) => theme.typography.fontFamilyTitle }}
              color="error.main"
            >
              {t("worlds.settings.danger-zone", "Danger zone")}
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
              {t(
                "worlds.settings.delete-help",
                "Deleting this world permanently removes its contents and unlinks it from every game.",
              )}
            </Typography>
            <DeleteWorldButton
              worldId={world.id}
              worldName={world.name}
              onDeleted={onWorldDeleted}
            />
          </Box>
        </>
      )}
    </Stack>
  );
}
