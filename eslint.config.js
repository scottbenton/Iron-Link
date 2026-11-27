import js from "@eslint/js";
import i18next from "eslint-plugin-i18next";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "src/styled-system", "storybook-static"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  {
    // Screens lay out with ui/primitives and style through ui components, so
    // the styling system can be replaced inside src/ui alone.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/ui/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["styled-system", "styled-system/*", "@pandacss/*"],
              message:
                "Use ui/primitives for layout and ui components for styling instead of Panda directly.",
            },
            {
              group: ["@phosphor-icons/*"],
              message: "Import icons from ui/icons.",
            },
          ],
        },
      ],
    },
  },
  {
    // The UI library's text goes through t() with ui. keys, so it can be
    // translated before the app uses it (src/ui/README.md, Translation).
    // JSX text, label-like attributes and literals inside JSX expressions
    // are checked. Default prop values are not, so write those with t() too.
    files: ["src/ui/**/*.{ts,tsx}"],
    ignores: [
      "src/ui/**/__stories__/**",
      "src/ui/**/__tests__/**",
      "src/ui/docs/**",
      "src/ui/layout/Examples/**",
    ],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": [
        "error",
        {
          mode: "jsx-only",
          "should-validate-template": true,
          // Lowercase words without spaces are ids and states
          // ("current", "img"), not text.
          words: { exclude: ["^[^\\sA-Z]*$"] },
          "jsx-attributes": {
            include: [
              "label",
              "aria-label",
              "aria-valuetext",
              "aria-description",
              "title",
              "placeholder",
              "alt",
              "description",
              "caption",
              "helperText",
              "emptyText",
              "tooltip",
            ],
          },
        },
      ],
    },
  },
);
