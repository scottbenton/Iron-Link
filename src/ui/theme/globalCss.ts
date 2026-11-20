/**
 * Global rules the library needs. Kept small on purpose: preflight is off
 * while MUI renders the rest of the app, so nothing here styles bare elements.
 */
export const globalCss = {
  // Allo's roundness, 0 (sharp) to 100 (round), default 50. Set on the root
  // so every element using the body font inherits it; fonts without the
  // axis (MUI's) ignore it. Set it again on anything that sets its own
  // font-variation-settings, which replaces this rather than adding to it.
  ":root": { fontVariationSettings: '"ROND" 30' },
  ":root[data-lift=on]": { "--spacing-lift": "-1px" },
  "@media (prefers-reduced-motion: reduce)": {
    ":root:not([data-motion=full])": {
      "--spacing-lift": "0px",
      "--spacing-sink": "0px",
      "--durations-ring-spin": "0s",
    },
  },
  ":root[data-motion=reduced]": {
    "--spacing-lift": "0px",
    "--spacing-sink": "0px",
    "--durations-ring-spin": "0s",
  },
  // Library surfaces opt in with this class; the app's own body stays MUI's.
  ".ui-root": {
    fontFamily: "body",
    color: "fg.default",
    WebkitFontSmoothing: "antialiased",
  },
  // The stat and roll ring's reveal angle, animated by the Draw reveal.
  "@property --ring-reveal": {
    syntax: '"<angle>"',
    inherits: "false",
    initialValue: "0deg",
  },
};
