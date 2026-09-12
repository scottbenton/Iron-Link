import { Color } from "@mui/material/styles";

type ColorWith950 = Color & { 950: string };

// Tailwind Slate
// const greyPalette: Omit<ColorWith950, "A100" | "A200" | "A400" | "A700"> = {
//   50: "#f9fafb",
//   100: "#f1f5f9",
//   200: "#e2e8f0",
//   300: "#cbd5e1",
//   400: "#94a3b8",
//   500: "#64748b",
//   600: "#475569",
//   700: "#334155",
//   800: "#1e293b",
//   900: "#0f172a",
//   950: "#020617",
// };

// Tailwind Gray
const greyPalette: Omit<ColorWith950, "A100" | "A200" | "A400" | "A700"> = {
  50: "#f9fafb",
  100: "#f3f4f6",
  200: "#e5e7eb",
  300: "#d1d5db",
  400: "#9ca3af",
  500: "#6b7280",
  600: "#4b5563",
  700: "#374151",
  800: "#1f2937",
  900: "#111827",
  950: "#030712",
};

// Tailwind Zinc
// const greyPalette: Omit<ColorWith950, "A100" | "A200" | "A400" | "A700"> = {
//   50: "#fafafa",
//   100: "#f4f4f5",
//   200: "#e4e4e7",
//   300: "#d4d4d8",
//   400: "#a1a1aa",
//   500: "#71717a",
//   600: "#52525b",
//   700: "#3f3f46",
//   800: "#27272a",
//   900: "#18181b",
//   950: "#09090b",
// };

export const grey: ColorWith950 = {
  ...greyPalette,
  A100: greyPalette[100],
  A200: greyPalette[200],
  A400: greyPalette[400],
  A700: greyPalette[700],
};

// Status colors are mode-aware: light mode uses the Tailwind 700 ramp stop so
// it clears WCAG AA against a white surface; dark mode uses the 400 stop so it
// clears AA against the dark surface. contrastText is pinned explicitly rather
// than left to MUI's 3.0 contrast threshold.
export const sharedStatusColorsLight = {
  success: {
    light: "#009966",
    main: "#007a55",
    dark: "#006045",
    contrastText: "#ffffff",
  },
  warning: {
    light: "#e17100",
    main: "#bb4d00",
    dark: "#973c00",
    contrastText: "#ffffff",
  },
  error: {
    light: "#e7000b",
    main: "#c10007",
    dark: "#9f0712",
    contrastText: "#ffffff",
  },
  info: {
    light: "#0084d1",
    main: "#00699d",
    dark: "#035888",
    contrastText: "#ffffff",
  },
};

export const sharedStatusColorsDark = {
  success: {
    light: "#5ee9b5",
    main: "#00d492",
    dark: "#00bc7d",
    contrastText: "#030712",
  },
  warning: {
    light: "#ffd230",
    main: "#ffb900",
    dark: "#fe9a00",
    contrastText: "#030712",
  },
  error: {
    light: "#ffa2a2",
    main: "#ff6467",
    dark: "#fb2c36",
    contrastText: "#030712",
  },
  info: {
    light: "#74d4ff",
    main: "#00bcff",
    dark: "#00a6f4",
    contrastText: "#030712",
  },
};

export const cursedLight = {
  light: "#5ea500",
  main: "#497d00",
  dark: "#3c6300",
  contrastText: "#ffffff",
};

export const cursedDark = {
  light: "#bbf451",
  main: "#9ae600",
  dark: "#7ccf00",
  contrastText: "#030712",
};
