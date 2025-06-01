import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Box,
  ButtonBase,
  Grid,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { getTheme } from "providers/ThemeProvider/themes/themeConfig";

import { ColorScheme } from "repositories/shared.types";

import { IronLinkLogo } from "./Layout/IronLinkLogo";

export interface ColorSchemeSelectorProps {
  selectedColorScheme: ColorScheme;
  onChange: (colorScheme: ColorScheme) => void;
}

export function ColorSchemeSelector(props: ColorSchemeSelectorProps) {
  const { selectedColorScheme, onChange } = props;

  return (
    <Grid container spacing={1}>
      {Object.values(ColorScheme).map((scheme) => (
        <ThemedBox
          key={scheme}
          selected={selectedColorScheme === scheme}
          colorScheme={scheme}
          onClick={() => onChange(scheme)}
        />
      ))}
    </Grid>
  );
}

function getColorSchemeName(colorScheme: ColorScheme, t: TFunction): string {
  switch (colorScheme) {
    case ColorScheme.Default:
      return t("colorScheme.default", "Iron Link");
    case ColorScheme.Cinder:
      return t("colorScheme.cinder", "Cinder");
    case ColorScheme.Eidolon:
      return t("colorScheme.eidolon", "Eidolon");
    case ColorScheme.Hinterlands:
      return t("colorScheme.hinterlands", "Hinterlands");
    case ColorScheme.Myriad:
      return t("colorScheme.myriad", "Myriad");
    case ColorScheme.Mystic:
      return t("colorScheme.mystic", "Mystic");
    case ColorScheme.PrideTraditional:
      return t("colorScheme.prideTraditional", "Pride");
    default:
      return t("colorScheme.unknown", "Unknown");
  }
}

export function ThemedBox(props: {
  selected: boolean;
  colorScheme: ColorScheme;
  onClick: () => void;
}) {
  const { selected, colorScheme, onClick } = props;
  const { t } = useTranslation();

  const theme = getTheme(colorScheme);

  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <ThemeProvider theme={theme}>
        <ButtonBase
          focusRipple
          onClick={onClick}
          sx={(theme) => ({
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 2,
            position: "relative",
          })}
        >
          {selected && (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
              }}
            >
              <CheckCircleIcon aria-label={t("common.selected", "Selected")} />
            </Box>
          )}
          <IronLinkLogo sx={{ width: 64, height: 64 }} />
          <Typography
            variant="h6"
            fontFamily="fontFamilyTitle"
            textTransform={"capitalize"}
          >
            {getColorSchemeName(colorScheme, t)}
          </Typography>
        </ButtonBase>
      </ThemeProvider>
    </Grid>
  );
}
