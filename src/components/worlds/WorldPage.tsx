import { Box, LinearProgress, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useWorldPlayerRole, useWorldStore } from "stores/world.store";

export function WorldPage() {
  const { t } = useTranslation();

  const worldId = useWorldStore((store) => store.world?.id);
  const isWorldLoading = useWorldStore((store) => store.loading);
  const worldError = useWorldStore((store) => store.error);
  const worldName = useWorldStore((store) => store.world?.name);

  const canChangeName = useWorldPlayerRole().isGuideOrOwner;
  const setName = useWorldStore((store) => store.setWorldName);

  return (
    <Box mt={2}>
      {isWorldLoading && <LinearProgress />}
      {worldError &&
        t("world.load-failure", "Failed to load world: {{error}}", {
          error: worldError,
        })}

      {canChangeName && worldId ? (
        <TextField
          label={t("world.name", "World Name")}
          defaultValue={worldName || ""}
          onBlur={(e) => setName(worldId, e.target.value)}
          fullWidth
          variant="outlined"
        />
      ) : (
        <Typography variant="h5">{worldName}</Typography>
      )}
    </Box>
  );
}
