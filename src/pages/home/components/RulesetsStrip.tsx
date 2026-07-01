import { Box, Chip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export function RulesetsStrip() {
  const { t } = useTranslation();

  const rulesets = [
    t("home.rulesets.ironsworn", "Ironsworn"),
    t("home.rulesets.delve", "Ironsworn: Delve"),
    t("home.rulesets.starforged", "Starforged"),
    t("home.rulesets.sundered-isles", "Sundered Isles"),
  ];

  return (
    <Box
      display="flex"
      flexWrap="wrap"
      alignItems="center"
      justifyContent="center"
      gap={1}
    >
      <Typography
        variant="overline"
        component="p"
        color="text.secondary"
        fontFamily={(theme) => theme.typography.fontFamilyTitle}
        letterSpacing={2}
        mr={1}
      >
        {t("home.rulesets.eyebrow", "Supports")}
      </Typography>
      {rulesets.map((ruleset) => (
        <Chip key={ruleset} label={ruleset} variant="outlined" />
      ))}
    </Box>
  );
}
