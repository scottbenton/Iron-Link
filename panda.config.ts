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
  // The whole app, so screens that lay out with ui/primitives get their
  // style props extracted.
  include: ["./src/**/*.{ts,tsx}", "./.storybook/**/*.{ts,tsx}"],
  exclude: ["./src/styled-system/**"],
  outdir: "src/styled-system",
  jsxFramework: "react",
  // Style props are read only from Panda's own JSX, ui/primitives and the
  // library's components (their `css` prop: `<Button css={{ mt: "2" }}>`). Left to
  // itself Panda reads any capitalised component, so MUI's Box, Stack and
  // icons (`color="primary"`, `fontSize="small"`) would add stray classes.
  jsxMatchTag: [
    { tag: /./, ignore: true },
    { from: /(^|\/)styled-system\/jsx$/ },
    { from: /(^|\/)ui\/primitives$/ },
    { from: /(^|\/)ui\/(components|game|layout)(\/|$)/ },
    { tag: /^styled\./ },
  ],
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
      // Disabled controls never answer a hover or a press, whatever order
      // the atomic rules land in.
      hover:
        "&:is(:hover, [data-hover]):not(:disabled, [data-disabled], [aria-disabled=true])",
      pressed:
        "&:is(:active, [data-pressed]):not(:disabled, [data-disabled], [aria-disabled=true])",
      open: "&:is([data-open], [data-popup-open], [aria-expanded=true])",
      current:
        "&:is([aria-current]:not([aria-current=false]), [data-selected], [aria-selected=true])",
      startingStyle: "&[data-starting-style]",
      endingStyle: "&[data-ending-style]",
    },
  },
  patterns: {
    extend: {
      // Panda's Container caps at an "8xl" size this theme does not define.
      // Ours uses the content rail widths the layout already uses.
      container: {
        description: "A centred column of content with the page's side padding",
        properties: {
          size: { type: "enum", value: ["sm", "md", "lg", "xl", "full"] },
        },
        defaultValues: { size: "xl" },
        transform(props) {
          const { size, ...rest } = props;
          const widths: Record<string, string> = {
            sm: "640px",
            md: "900px",
            lg: "1200px",
            xl: "1440px",
            full: "none",
          };
          return {
            position: "relative",
            boxSizing: "border-box",
            width: "full",
            maxWidth: widths[size as string] ?? size,
            marginInline: "auto",
            paddingInline: { base: "4", md: "6" },
            ...rest,
          };
        },
      },
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
        // Skeletons fade in and out together rather than sweep, so a group
        // of them reads as one block loading.
        pulse: { "50%": { opacity: 0.45 } },
        // A die landing on a new face: a small turn, or a small pop.
        dieTilt: {
          from: { transform: "rotate(-18deg)" },
          to: { transform: "rotate(0)" },
        },
        diePop: {
          from: { transform: "scale(0.75)" },
          to: { transform: "scale(1)" },
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
