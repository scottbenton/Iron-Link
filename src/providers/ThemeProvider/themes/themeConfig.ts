import { SimplePaletteColorOptions, Theme, createTheme } from "@mui/material";

import { ColorScheme } from "repositories/shared.types";

import {
  cursedDark,
  cursedLight,
  grey,
  sharedStatusColorsDark,
  sharedStatusColorsLight,
} from "./colors";

interface ModePalette {
  primary: SimplePaletteColorOptions;
}

interface BrandTokens {
  /**
   * Gradient stops for the logo mark. A brand mark, not text -- these run a
   * wide tonal range (bright pale end into a deep saturated end) for glow and
   * to keep the schemes distinguishable from one another. Deliberately NOT
   * held to a contrast floor.
   */
  icon: string[];
  /**
   * Gradient stops for the GradientBox ring. The ring is always drawn around an
   * opaque dark inner box (grey.700 in light mode, grey.900 in dark), so it
   * reads as a glow against that chip rather than needing to be legible against
   * the page on its own -- which is why the pale stops are the point, not a
   * defect. What it must not be is a colour close to BOTH the inner box and the
   * page, which is the one case that makes it disappear. Falls back to `icon`.
   */
  ring?: string[];
}

export type ThemeConfig = Record<
  ColorScheme,
  {
    light: ModePalette;
    dark: ModePalette;
    brand: BrandTokens;
  }
>;

const BORDER_RADIUS = 8;

const LIGHT_CONTRAST_TEXT = "#ffffff";
const DARK_CONTRAST_TEXT = "#000000d0";

/**
 * Each theme carries two accent palettes: light mode uses the Tailwind 700 ramp
 * stop (AA against white), dark mode uses the 400 stop (AA against the dark
 * surface). Previously a single palette was spread into both modes, which left
 * most themes well below AA in dark mode.
 */
export const themeConfig: ThemeConfig = {
  [ColorScheme.Default]: {
    light: {
      primary: {
        light: "#e11d48", // Rose 600
        main: "#be123c", // Rose 700
        dark: "#9f1239", // Rose 800
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#fb7185", // Rose 400
        main: "#f43f5e", // Rose 500
        dark: "#e11d48", // Rose 600
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      icon: ["#fb7185", "#d08700"], // Rose 400, Amber 600
      ring: ["#e11d48", "#f59e0b"], // Rose 600, Amber 500
    },
  },
  [ColorScheme.Cinder]: {
    light: {
      primary: {
        light: "#dc2626", // Red 600
        main: "#b91c1c", // Red 700
        dark: "#991b1b", // Red 800
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#f87171", // Red 400
        main: "#ef4444", // Red 500
        dark: "#dc2626", // Red 600
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      icon: ["#f87171", "#991b1b"], // Red 400 -> Red 800
      ring: ["#fca5a5", "#b91c1c"], // Red 300 -> Red 700
    },
  },
  [ColorScheme.Eidolon]: {
    light: {
      primary: {
        light: "#ca8a04", // Yellow 600
        main: "#a16207", // Yellow 700
        dark: "#854d0e", // Yellow 800
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#facc15", // Yellow 400
        main: "#eab308", // Yellow 500
        dark: "#ca8a04", // Yellow 600
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      icon: ["#fde047", "#854d0e"], // Yellow 300 -> Yellow 800
      ring: ["#fef08a", "#ca8a04"], // Yellow 200 -> Yellow 600
    },
  },
  [ColorScheme.Hinterlands]: {
    light: {
      primary: {
        light: "#059669", // Emerald 600
        main: "#047857", // Emerald 700
        dark: "#065f46", // Emerald 800
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#34d399", // Emerald 400
        main: "#10b981", // Emerald 500
        dark: "#059669", // Emerald 600
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      icon: ["#6ee7b7", "#065f46"], // Emerald 300 -> Emerald 800
      ring: ["#6ee7b7", "#059669"], // Emerald 300 -> Emerald 600
    },
  },
  [ColorScheme.Myriad]: {
    light: {
      primary: {
        light: "#2563eb", // Blue 600
        main: "#1d4ed8", // Blue 700
        dark: "#1e40af", // Blue 800
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#60a5fa", // Blue 400
        main: "#3b82f6", // Blue 500
        dark: "#2563eb", // Blue 600
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      icon: ["#67e8f9", "#1d4ed8"], // Cyan 300 -> Blue 700
      ring: ["#22d3ee", "#2563eb"], // Cyan 400 -> Blue 600
    },
  },
  [ColorScheme.Mystic]: {
    light: {
      primary: {
        light: "#9333ea", // Purple 600
        main: "#7e22ce", // Purple 700
        dark: "#6b21a8", // Purple 800
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#d8b4fe", // Purple 300
        main: "#c084fc", // Purple 400
        dark: "#a855f7", // Purple 500
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      icon: ["#a78bfa", "#6b21a8"], // Violet 400 -> Purple 800
      ring: ["#a78bfa", "#9333ea"], // Violet 400 -> Purple 600
    },
  },
  [ColorScheme.PrideTraditional]: {
    light: {
      primary: {
        light: "#2563eb", // Blue 600
        main: "#1d4ed8", // Blue 700
        dark: "#1e40af", // Blue 800
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#60a5fa", // Blue 400
        main: "#3b82f6", // Blue 500
        dark: "#2563eb", // Blue 600
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      icon: [
        "oklch(63.7% 0.237 25.331)",
        "oklch(70.5% 0.213 47.604)",
        "oklch(79.5% 0.184 86.047)",
        "oklch(69.6% 0.17 162.48)",
        "oklch(62.3% 0.214 259.815)",
        "oklch(60.6% 0.25 292.717)",
      ],
    },
  },
  [ColorScheme.Orchid]: {
    light: {
      primary: {
        light: "#db2777", // Pink 600
        main: "#be185d", // Pink 700
        dark: "#9d174d", // Pink 800
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#f472b6", // Pink 400
        main: "#ec4899", // Pink 500
        dark: "#db2777", // Pink 600
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      icon: ["#e879f9", "#be185d"], // Fushia 400 -> Pink 700
      ring: ["#f472b6", "#db2777"], // Pink 400 -> Pink 600
    },
  },
  [ColorScheme.Gloaming]: {
    light: {
      primary: {
        light: "#9333ea", // Purple 600
        main: "#7e22ce", // Purple 700
        dark: "#6b21a8", // Purple 800
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#d8b4fe", // Purple 300
        main: "#c084fc", // Purple 400
        dark: "#a855f7", // Purple 500
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      icon: ["#ec4899", "#9333ea", "#3b82f6"], // Pink 500 Purple 600 Blue 500
      ring: ["#f472b6", "#a855f7", "#60a5fa"], // Pink 400 Purple 500 Blue 400
    },
  },
};

/**
 * Theme-independent secondary action color. Nothing consumes `palette.secondary`
 * today — it is reserved for a future second action color, and deliberately kept
 * out of the per-theme config so it does not drift with the accent.
 */
const secondaryLight: SimplePaletteColorOptions = {
  light: "#45556c",
  main: "#314158",
  dark: "#1d293b",
  contrastText: "#ffffff",
};

const secondaryDark: SimplePaletteColorOptions = {
  light: "#cad5e2",
  main: "#90a1b9",
  dark: "#62748e",
  contrastText: "#030712",
};

export function getTheme(colorScheme: ColorScheme): Theme {
  return createTheme({
    shape: {
      borderRadius: BORDER_RADIUS,
    },
    typography: {
      fontFamily: [
        "Inter Variable",
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Roboto",
        '"Helvetica Neue"',
        "Arial",
        "sans-serif",
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(","),
      fontFamilyTitle: [
        "Barlow Condensed",
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Roboto",
        '"Helvetica Neue"',
        "Arial",
        "sans-serif",
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(","),
    },
    palette: {
      grey: grey,
      background: {
        paper: "#fff",
        default: grey[100],
      },
      text: {
        primary: grey[800],
        secondary: grey[700],
        disabled: grey[500],
      },
      action: {
        active: grey[950] + "8a",
        hover: grey[950] + "0a",
        selected: grey[950] + "14",
        disabled: grey[950] + "42",
        disabledBackground: grey[950] + "1f",
        focus: grey[950] + "1f",
      },
      cursed: cursedLight,
      gradients: getGradients(colorScheme),
      secondary: secondaryLight,
      ...themeConfig[colorScheme].light,
      ...sharedStatusColorsLight,
    },
    transitions: {
      duration: {
        enteringScreen: 400,
        leavingScreen: 200,
      },
      easing: {
        easeIn: "cubic-bezier(0.3, 0.0, 0.8, 0.15)",
        easeOut: "cubic-bezier(0.05, 0.7, 0.1, 1.0)",
      },
    },
    colorSchemes: {
      dark: {
        palette: {
          mode: "dark",
          grey,
          divider: grey[700],
          gradients: getGradients(colorScheme),
          background: {
            paper: grey[900],
            default: grey[950],
          },
          text: {
            primary: grey[50],
            secondary: grey[300],
            disabled: grey[400],
          },
          action: {
            hover: grey[100] + "14",
            selected: grey[100] + "29",
            disabled: grey[100] + "90",
            disabledBackground: grey[100] + "1f",
            focus: grey[100] + "1f",
          },
          cursed: cursedDark,
          secondary: secondaryDark,
          ...themeConfig[colorScheme].dark,
          ...sharedStatusColorsDark,
        },
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            // border: `1px solid ${
            //   config.palette.grey[type === ThemeType.Light ? 300 : 700]
            // }`,
            backgroundImage: "unset!important", // Remove the annoying elevation background filter
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: BORDER_RADIUS,
            "& .MuiTouchRipple-root .MuiTouchRipple-child": {
              borderRadius: BORDER_RADIUS,
            },
          },
        },
      },
    },
  });
}

function getGradients(colorScheme: ColorScheme) {
  const { icon, ring } = themeConfig[colorScheme].brand;

  if (colorScheme === ColorScheme.PrideTraditional) {
    return {
      outline: `linear-gradient(90deg, ${distributeStops(icon, 0, 83.33).join(", ")})`,
      icon,
    };
  }

  const outlineStops = ring ?? icon;

  return {
    outline: `radial-gradient(142% 91% at 111% 84%, ${distributeStops(
      outlineStops,
      20,
      80,
    ).join(", ")})`,
    icon,
  };
}

/** Spreads N color stops evenly across the [start, end] percentage range. */
function distributeStops(colors: string[], start: number, end: number) {
  return colors.map((color, index) => {
    const position =
      colors.length === 1
        ? start
        : start + ((end - start) * index) / (colors.length - 1);
    return `${color} ${roundPercent(position)}%`;
  });
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

declare module "@mui/material" {
  interface TypographyOptions {
    fontFamilyTitle: string;
  }
}
