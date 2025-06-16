import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardActionArea,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useUsersWorldsFilteredByRole } from "stores/users.worlds.store";

export function WorldSelectionPage() {
  const { t } = useTranslation();

  const { worlds, loading, error } = useUsersWorldsFilteredByRole("owner");

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box mt={2}>
      {worlds.length > 0 && (
        <>
          <Typography>
            {t("game.worlds.use-existing", "Choose an existing world")}
          </Typography>
          <Stack spacing={1} mt={1}>
            {worlds.map((world) => (
              <Card variant="outlined" key={world.id}>
                <CardActionArea sx={{ px: 2, py: 1 }}>
                  <Typography
                    fontFamily={(theme) => theme.typography.fontFamilyTitle}
                    variant="h6"
                  >
                    {world.name}
                  </Typography>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
          <Divider sx={{ my: 2 }}>{t("common.or", "Or")}</Divider>
        </>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>
            {t("game.worlds.error", "Error loading worlds")}
          </AlertTitle>
          {error}
        </Alert>
      )}

      <Button>Create a New World</Button>
    </Box>
  );
}
