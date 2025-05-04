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

export const sharedStatusColors = {
  success: {
    light: "#10b981",
    main: "#059669",
    dark: "#047857",
  },
  warning: {
    light: "#d97706",
    main: "#b45309",
    dark: "#92400e",
  },
  error: {
    light: "#ef4444",
    main: "#dc2626",
    dark: "#b91c1c",
  },
  info: {
    light: "#0ea5e9",
    main: "#0284c7",
    dark: "#0369a1",
  },
};
