import { TextField } from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useDebouncedSync } from "hooks/useDebouncedSync";

import { useWorldStore } from "stores/world.store";

export interface WorldNameFieldProps {
  worldId: string;
  name: string;
  disabled?: boolean;
}

// Inline, debounced editing of the world name, following the same
// useDebouncedSync pattern the character sheet fields use.
export function WorldNameField(props: WorldNameFieldProps) {
  const { worldId, name, disabled } = props;

  const { t } = useTranslation();

  const updateWorldName = useWorldStore((store) => store.updateWorldName);

  const persistName = useCallback(
    (newName: string) => {
      const trimmedName = newName.trim();
      if (!trimmedName || trimmedName === name) {
        return;
      }
      updateWorldName(worldId, trimmedName).catch(() => {});
    },
    [worldId, name, updateWorldName],
  );

  const [value, setValue] = useDebouncedSync(persistName, name);

  return (
    <TextField
      label={t("worlds.panel.world-name", "World Name")}
      value={value}
      onChange={(evt) => setValue(evt.currentTarget.value)}
      disabled={disabled}
      error={!disabled && !value.trim()}
      helperText={
        disabled
          ? undefined
          : t(
              "worlds.settings.name-help",
              "Name changes save automatically. A world name cannot be blank.",
            )
      }
      fullWidth
    />
  );
}
