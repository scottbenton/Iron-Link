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
  /** Gradient stops for the logo mark. */
  icon: string[];
  /**
   * Gradient stops for the outline/ring treatment. Defaults to `icon` when a
   * theme's icon stops already read well as a ring on a light page.
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
const DARK_CONTRAST_TEXT = grey[950];

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
        light: "#ec003f",
        main: "#c70036",
        dark: "#a50036",
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#ffa1ad",
        main: "#ff637e",
        dark: "#ff2056",
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      // Default is the one theme that keeps its original bright mark, by
      // explicit product decision. Those stops are too light to read as a ring
      // on a light page, so it is also the one theme that needs a `ring`
      // override.
      icon: ["#ff637e", "#d08700"],
      ring: ["#ec003f", "#bb4d00"],
    },
  },
  [ColorScheme.Cinder]: {
    light: {
      primary: {
        light: "#e7000b",
        main: "#c10007",
        dark: "#9f0712",
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#ffa2a2",
        main: "#ff6467",
        dark: "#fb2c36",
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      icon: ["#f54a00", "#e7000b"],
    },
  },
  [ColorScheme.Eidolon]: {
    light: {
      primary: {
        light: "#d08700",
        main: "#a65f00",
        dark: "#894b00",
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#ffdf20",
        main: "#fdc700",
        dark: "#f0b100",
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      icon: ["#ca3500", "#a65f00"],
    },
  },
  [ColorScheme.Hinterlands]: {
    light: {
      primary: {
        light: "#009966",
        main: "#007a55",
        dark: "#006045",
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#5ee9b5",
        main: "#00d492",
        dark: "#00bc7d",
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      icon: ["#497d00", "#007a55"],
    },
  },
  [ColorScheme.Myriad]: {
    light: {
      primary: {
        light: "#155dfc",
        main: "#1447e6",
        dark: "#193cb8",
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#8ec5ff",
        main: "#51a2ff",
        dark: "#2b7fff",
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      icon: ["#0092b8", "#155dfc"],
    },
  },
  [ColorScheme.Mystic]: {
    light: {
      primary: {
        light: "#7f22fe",
        main: "#7008e7",
        dark: "#5d0ec0",
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#c4b4ff",
        main: "#a684ff",
        dark: "#8e51ff",
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      icon: ["#c800de", "#7f22fe"],
    },
  },
  [ColorScheme.PrideTraditional]: {
    light: {
      primary: {
        light: "#155dfc",
        main: "#1447e6",
        dark: "#193cb8",
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#8ec5ff",
        main: "#51a2ff",
        dark: "#2b7fff",
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
        light: "#e12afb",
        main: "#c800de",
        dark: "#a800b7",
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#f4a8ff",
        main: "#ed6bff",
        dark: "#e12afb",
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      icon: ["#c800de", "#e60076"],
    },
  },
  [ColorScheme.Gloaming]: {
    light: {
      primary: {
        light: "#e60076",
        main: "#d60270",
        dark: "#a3004c",
        contrastText: LIGHT_CONTRAST_TEXT,
      },
    },
    dark: {
      primary: {
        light: "#fccee8",
        main: "#fb64b6",
        dark: "#f6339a",
        contrastText: DARK_CONTRAST_TEXT,
      },
    },
    brand: {
      icon: ["#d60270", "#9b4f96", "#155dfc"],
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
