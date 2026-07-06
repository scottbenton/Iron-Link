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
              "Tap a stat to roll it. Assets, meters, momentum, and vows on one screen, with the full rules reference one click away.",
            )}
          </Typography>
        </Box>
        <Box
          component={"img"}
          src="/images/SoloGame.webp"
          alt="Screenshot of a solo game with a character overview, notes, and the referense sidebar all visible."
          sx={(theme) => ({
            borderRadius: 1,
            aspectRatio: "16 / 10",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: theme.palette.divider,
            width: "100%",
          })}
        />
      </Box>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "3fr 2fr" }}
        gap={3}
        alignItems="center"
      >
        <Box
          component={"img"}
          src="/images/GuidedGame.webp"
          alt="Screenshot of a guided game with characters, notes, and the game's log all visible."
          sx={(theme) => ({
            order: { xs: 2, md: 1 },
            borderRadius: 1,
            aspectRatio: "16 / 10",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: theme.palette.divider,
            width: "100%",
          })}
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
