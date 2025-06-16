import {
  Alert,
  Box,
  Card,
  CardActionArea,
  LinearProgress,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { SectionHeading } from "components/SectionHeading";

import { useUID } from "stores/auth.store";
import { useUsersWorlds } from "stores/users.worlds.store";

import { IWorld } from "services/worlds.service";

export function ChooseAWorld() {
  const { t } = useTranslation();

  const [worldsState, setWorldsState] = useState<{
    worlds: IWorld[];
    loading: boolean;
    error: string | null;
  }>({
    worlds: [],
    loading: true,
    error: null,
  });
  const getFilteredWorlds = useUsersWorlds(
    (state) => state.getUsersWorldsFilteredByRole,
  );
  const uid = useUID();

  useEffect(() => {
    if (!uid) return;

    setWorldsState((prev) => ({ ...prev, loading: true, error: null }));
    getFilteredWorlds(uid, "owner")
      .then((worlds) => {
        setWorldsState({ worlds, loading: false, error: null });
      })
      .catch((error) => {
        setWorldsState({
          worlds: [],
          loading: false,
          error: error.message || "Failed to load worlds.",
        });
      });
  }, [uid, getFilteredWorlds]);

  return (
    <Box mt={4}>
      <SectionHeading rounded label={t("characterSheet.notes.chooseAWorld")} />
      {worldsState.loading && <LinearProgress />}
      {worldsState.error && (
        <Alert severity="error">
          {t(
            "characterSheet.notes.errorLoadingWorlds",
            "Failed to load your worlds.",
          )}
        </Alert>
      )}
      {worldsState.worlds.length > 0 && (
        <>
          {worldsState.worlds.map((world) => (
            <Card key={world.id}>
              <CardActionArea onClick={() => {}}>
                <Typography variant="h6">{world.name}</Typography>
              </CardActionArea>
            </Card>
          ))}
        </>
      )}
    </Box>
  );
}
