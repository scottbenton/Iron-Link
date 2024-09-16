import React from "react";
import {
  Box,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
  useColorScheme as useThemeMode,
} from "@mui/material";
import { ColorScheme, useColorScheme } from "../src/atoms/theme.atom";

export function PreviewHeader() {
  const { colorScheme: mode, setColorScheme: setMode } = useThemeMode();
  const [colorScheme, setColorScheme] = useColorScheme();

  return (
    <Box
      display={"flex"}
      px={4}
      py={2}
      bgcolor={"background.paper"}
      borderBottom={1}
      borderColor={"divider"}
    >
      <TextField
        size={"small"}
        sx={{ minWidth: 150 }}
        select
        label={"Color Scheme"}
        value={colorScheme}
        onChange={(evt) => setColorScheme(evt.target.value as ColorScheme)}
      >
        <MenuItem value={ColorScheme.Default}>Default</MenuItem>
        <MenuItem value={ColorScheme.Cinder}>Cinder</MenuItem>
        <MenuItem value={ColorScheme.Eidolon}>Eidolon</MenuItem>
        <MenuItem value={ColorScheme.Hinterlands}>Hinterlands</MenuItem>
        <MenuItem value={ColorScheme.Myriad}>Myriad</MenuItem>
        <MenuItem value={ColorScheme.Mystic}>Mystic</MenuItem>
      </TextField>
      <FormControlLabel
        control={
          <Switch
            checked={mode === "dark"}
            onChange={(evt) => {
              setMode(evt.target.checked ? "dark" : "light");
            }}
          />
        }
        label="Dark Mode"
        sx={{ ml: 1 }}
      />
    </Box>
  );
}