import { defineConfig } from "@pandacss/dev";

import { globalCss } from "./src/ui/theme/globalCss";
import { schemeThemes } from "./src/ui/theme/schemes";
import { semanticTokens, tokens } from "./src/ui/theme/tokens";

export default defineConfig({
  // MUI still renders most of the app, so Panda's reset stays off until it
  // is gone. Library components set what they need themselves.
  preflight: false,
  // Panda 2 ships no presets by default. preset-base brings the conditions
  // (_hover, _focusVisible, ...), utilities and layout patterns; the tokens
  // are all ours, so preset-panda's palette stays out.
  presets: ["@pandacss/preset-base"],
  include: ["./src/ui/**/*.{ts,tsx}", "./.storybook/**/*.{ts,tsx}"],
  exclude: ["./src/styled-system/**"],
  outdir: "src/styled-system",
  jsxFramework: "react",
  strictTokens: false,
  conditions: {
    extend: {
      // The app always resolves the mode and writes data-theme on <html>
      // (see useUIThemeAttributes), so one attribute selector covers it.
      dark: "[data-theme=dark] &",
      light: "[data-theme=light] &",
      hoverable: "@media (hover: hover)",
      reducedMotion: "@media (prefers-reduced-motion: reduce)",
      touch: "@media (pointer: coarse)",
      pressed: "&:is(:active, [data-pressed])",
      open: "&:is([data-open], [data-popup-open], [aria-expanded=true])",
      current: "&:is([aria-current]:not([aria-current=false]), [data-selected], [aria-selected=true])",
      startingStyle: "&[data-starting-style]",
      endingStyle: "&[data-ending-style]",
    },
  },
  theme: {
    extend: {
      breakpoints: {
        sm: "600px",
        md: "900px",
        lg: "1200px",
        xl: "1536px",
      },
      tokens,
      semanticTokens,
      keyframes: {
        ringSpin: { to: { transform: "rotate(1turn)" } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeOut: { from: { opacity: 1 }, to: { opacity: 0 } },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        indeterminate: {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(250%)" },
        },
      },
    },
  },
  // Each colour scheme is a Panda theme, applied with
  // data-panda-theme="<scheme>" on <html>. Default needs none.
  themes: schemeThemes,
  staticCss: { themes: Object.keys(schemeThemes) },
  globalCss,
});
