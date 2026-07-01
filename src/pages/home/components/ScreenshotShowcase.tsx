import PhotoIcon from "@mui/icons-material/Photo";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export function ScreenshotShowcase() {
  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection="column" gap={6}>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "2fr 3fr" }}
        gap={3}
        alignItems="center"
      >
        <Box>
          <Typography
            variant="h5"
            component="h2"
            fontFamily={(theme) => theme.typography.fontFamilyTitle}
            fontWeight={600}
          >
            {t("home.showcase.sheet-title", "A sheet that plays fast")}
          </Typography>
          <Typography color="text.secondary" mt={1}>
            {t(
              "home.showcase.sheet-description",
              "Tap a stat to roll it. Assets, meters, momentum, and vows on one screen — with the full rules reference one click away.",
            )}
          </Typography>
        </Box>
        <ScreenshotPlaceholder
          label={t(
            "home.showcase.sheet-screenshot",
            "Screenshot: character sheet with the reference sidebar and a roll result",
          )}
        />
      </Box>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "3fr 2fr" }}
        gap={3}
        alignItems="center"
      >
        <ScreenshotPlaceholder
          label={t(
            "home.showcase.overview-screenshot",
            "Screenshot: game overview with characters and shared tracks",
          )}
          sx={{ order: { xs: 2, md: 1 } }}
        />
        <Box sx={{ order: { xs: 1, md: 2 } }}>
          <Typography
            variant="h5"
            component="h2"
            fontFamily={(theme) => theme.typography.fontFamilyTitle}
            fontWeight={600}
          >
            {t("home.showcase.overview-title", "One view of the whole game")}
          </Typography>
          <Typography color="text.secondary" mt={1}>
            {t(
              "home.showcase.overview-description",
              "Every character, shared track, and clock in your campaign, live — whether you're across the table or across the world.",
            )}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// TODO: replace these placeholders with real app screenshots once captured.
function ScreenshotPlaceholder(props: {
  label: string;
  sx?: React.ComponentProps<typeof Box>["sx"];
}) {
  const { label, sx } = props;

  return (
    <Box
      sx={[
        {
          border: 1,
          borderStyle: "dashed",
          borderColor: "divider",
          borderRadius: 2,
          aspectRatio: "16 / 10",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          color: "text.secondary",
          px: 2,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <PhotoIcon />
      <Typography variant="caption" textAlign="center">
        {label}
      </Typography>
    </Box>
  );
}
