import { TextField } from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useDebouncedSync } from "hooks/useDebouncedSync";

import { useWorldStore } from "stores/world.store";

export interface WorldNameFieldProps {
  worldId: string;
  name: string;
}

// Inline, debounced editing of the world name, following the same
// useDebouncedSync pattern the character sheet fields use.
export function WorldNameField(props: WorldNameFieldProps) {
  const { worldId, name } = props;

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
      variant="standard"
      fullWidth
      slotProps={{
        htmlInput: {
          sx: (theme) => ({
            ...theme.typography.h4,
            fontFamily: theme.typography.fontFamilyTitle,
            textTransform: "uppercase",
          }),
        },
      }}
    />
  );
}
