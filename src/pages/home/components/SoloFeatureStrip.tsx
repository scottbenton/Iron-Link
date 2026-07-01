import CloudDoneIcon from "@mui/icons-material/CloudDone";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import { Box, SvgIconTypeMap, Typography } from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { useTranslation } from "react-i18next";

export function SoloFeatureStrip() {
  const { t } = useTranslation();

  const features: {
    Icon: OverridableComponent<SvgIconTypeMap>;
    label: string;
  }[] = [
    {
      Icon: PersonAddIcon,
      label: t("home.solo.character-creation", "Guided character creation"),
    },
    {
      Icon: MenuBookIcon,
      label: t("home.solo.reference", "Full moves & oracle reference"),
    },
    {
      Icon: TrackChangesIcon,
      label: t("home.solo.tracks", "Progress tracks & clocks"),
    },
    {
      Icon: CloudDoneIcon,
      label: t("home.solo.sync", "Synced across your devices"),
    },
  ];

  return (
    <Box
      borderTop={1}
      borderBottom={1}
      borderColor="divider"
      py={2}
      display="flex"
      flexWrap="wrap"
      alignItems="center"
      justifyContent="center"
      columnGap={4}
      rowGap={1}
    >
      <Typography
        variant="overline"
        component="p"
        color="text.secondary"
        fontFamily={(theme) => theme.typography.fontFamilyTitle}
        letterSpacing={2}
      >
        {t("home.solo.eyebrow", "And everything solo players expect")}
      </Typography>
      {features.map(({ Icon, label }) => (
        <Box key={label} display="flex" alignItems="center" gap={1}>
          <Icon color="primary" fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
