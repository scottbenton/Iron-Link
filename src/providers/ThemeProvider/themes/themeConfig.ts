import { SimplePaletteColorOptions, Theme, createTheme } from "@mui/material";

import { ColorScheme } from "repositories/shared.types";

import { grey, sharedStatusColors } from "./colors";

export type ThemeConfig = Record<
  ColorScheme,
  {
    primary: SimplePaletteColorOptions;
    secondary: SimplePaletteColorOptions;
  }
>;

const BORDER_RADIUS = 8;

export const themeConfig: ThemeConfig = {
  [ColorScheme.Default]: {
    primary: {
      light: "#f0b100",
      main: "#d08700",
      dark: "#a65f00",
    },
    secondary: {
      light: "#ffa1ad",
      main: "#ff637e",
      dark: "#ff2056",
    },
  },
  [ColorScheme.Cinder]: {
    primary: {
      light: "#e7000b",
      main: "#c10007",
      dark: "#9f0712",
    },
    secondary: {
      light: "#ffe4e6",
      main: "#ffccd3",
      dark: "#ffa1ad",
    },
  },
  [ColorScheme.Eidolon]: {
    primary: {
      light: "#d08700",
      main: "#a65f00",
      dark: "#894b00",
    },
    secondary: {
      light: "#fef3c6",
      main: "#fee685",
      dark: "#ffd230",
    },
  },
  [ColorScheme.Hinterlands]: {
    primary: {
      light: "#009966",
      main: "#007a55",
      dark: "#006045",
    },
    secondary: {
      light: "#dcfce7",
      main: "#b9f8cf",
      dark: "#7bf1a8",
    },
  },
  [ColorScheme.Myriad]: {
    primary: {
      light: "#155dfc",
      main: "#1447e6",
      dark: "#193cb8",
    },
    secondary: {
      light: "#cefafe",
      main: "#a2f4fd",
      dark: "#53eafd",
    },
  },
  [ColorScheme.Mystic]: {
    primary: {
      light: "#7f22fe",
      main: "#7008e7",
      dark: "#5d0ec0",
    },
    secondary: {
      light: "#f3e8ff",
      main: "#e9d4ff",
      dark: "#dab2ff",
    },
  },
  [ColorScheme.PrideTraditional]: {
    primary: {
      light: "#155dfc",
      main: "#1447e6",
      dark: "#193cb8",
    },
    secondary: {
      light: "#cefafe",
      main: "#a2f4fd",
      dark: "#53eafd",
    },
  },
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
      cursed: {
        light: "#9ae600",
        main: "#7ccf00",
        dark: "#5ea500",
        contrastText: "#000",
      },
      gradients: getGradients(colorScheme),
      ...themeConfig[colorScheme],
      ...sharedStatusColors,
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
          ...themeConfig[colorScheme],
          ...sharedStatusColors,
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
  if (colorScheme === ColorScheme.PrideTraditional) {
    const colors = [
      "oklch(63.7% 0.237 25.331)",
      "oklch(70.5% 0.213 47.604)",
      "oklch(79.5% 0.184 86.047)",
      "oklch(69.6% 0.17 162.48)",
      "oklch(62.3% 0.214 259.815)",
      "oklch(60.6% 0.25 292.717)",
    ];
    // start gradient at 15% and end at 85% to avoid the first and last colors being too close to the edges
    return {
      outline: `linear-gradient(90deg, ${colors[0]} 10%, ${colors[1]}, ${colors[2]}, ${colors[3]}, ${colors[4]}, ${colors[5]} 90%)`,
      icon: colors,
    };
  }

  return {
    outline: `radial-gradient(142% 91% at 111% 84%, ${themeConfig[colorScheme].secondary.dark} 20%, ${themeConfig[colorScheme].primary.light} 80%)`,
    icon: [
      themeConfig[colorScheme].secondary.main,
      themeConfig[colorScheme].primary.main,
    ],
  };
}

declare module "@mui/material" {
  interface TypographyOptions {
    fontFamilyTitle: string;
  }
}
