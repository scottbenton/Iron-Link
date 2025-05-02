import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Box,
  ButtonBase,
  Grid,
  ThemeProvider,
  Typography,
} from "@mui/material";
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
            {colorScheme}
          </Typography>
        </ButtonBase>
      </ThemeProvider>
    </Grid>
  );
}
