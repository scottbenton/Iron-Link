import { Stack, TextField } from "@mui/material";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { getWorldSettingLabel } from "lib/worldSettings";

import { WorldPermission } from "repositories/shared.types";

import { IWorld } from "services/worlds.service";

import { DeleteWorldButton } from "./DeleteWorldButton";
import { WorldNameField } from "./WorldNameField";
import { WorldSettingsSection } from "./WorldSettingsSection";

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
    <Stack spacing={4}>
      <WorldSettingsSection title={t("worlds.settings.general", "General")}>
        <Stack spacing={3}>
          <WorldNameField
            key={world.id}
            worldId={world.id}
            name={world.name}
            disabled={!canRename}
          />
          <TextField
            label={t("worlds.settings.setting", "Setting")}
            value={
              world.settingKey
                ? getWorldSettingLabel(world.settingKey)
                : t("worlds.panel.no-setting", "No setting")
            }
            helperText={t(
              "worlds.settings.setting-help",
              "The setting is chosen when the world is created.",
            )}
            fullWidth
            disabled
          />
        </Stack>
      </WorldSettingsSection>
      {additionalSettings}
      {permission === WorldPermission.Owner && (
        <WorldSettingsSection
          danger
          title={t("worlds.settings.danger-zone", "Danger zone")}
          description={t(
            "worlds.settings.delete-help",
            "Deleting this world permanently removes its contents and unlinks it from every game.",
          )}
        >
          <DeleteWorldButton
            worldId={world.id}
            worldName={world.name}
            onDeleted={onWorldDeleted}
          />
        </WorldSettingsSection>
      )}
    </Stack>
  );
}
