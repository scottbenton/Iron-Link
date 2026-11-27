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
    // App screens join the list as their slice moves them over.
    files: [
      "src/ui/**/*.{ts,tsx}",
      "src/components/Layout/**/*.{ts,tsx}",
      "src/components/ErrorMessage.tsx",
      "src/pages/404Page/**/*.{ts,tsx}",
      "src/pages/ErrorRoute.tsx",
      "src/pages/reference/**/*.{ts,tsx}",
      "src/components/datasworn/DataswornDialog/**/*.{ts,tsx}",
      "src/components/datasworn/Move/**/*.{ts,tsx}",
      "src/components/datasworn/Oracle/**/*.{ts,tsx}",
      "src/components/datasworn/DataswornTree/**/*.{ts,tsx}",
      "src/pages/home/**/*.{ts,tsx}",
      "src/pages/auth/**/*.{ts,tsx}",
      "src/pages/privacy/**/*.{ts,tsx}",
      "src/pages/gameJoin/**/*.{ts,tsx}",
      "src/pages/homebrew/**/*.{ts,tsx}",
      "src/pages/games/selectPage/**/*.{ts,tsx}",
      "src/pages/games/create/CreateGamePage.tsx",
      "src/pages/games/create/steps.tsx",
      "src/pages/games/create/components/ChooseGameType.tsx",
      "src/pages/games/create/components/GameDetails.tsx",
      "src/pages/games/create/components/CreateCharacterStep.tsx",
      "src/pages/games/create/components/RulesetExpansionSection.tsx",
      "src/pages/games/create/components/StepButtons.tsx",
      "src/components/datasworn/RulesPackageSelector/**/*.{ts,tsx}",
      "src/pages/games/gamePageLayout/**/*.{ts,tsx}",
      "src/pages/games/secondScreenPage/**/*.{ts,tsx}",
      "src/pages/games/overviewSheet/GameOverviewSheet.tsx",
      "src/pages/games/characterSheet/components/CharacterSidebarContents.tsx",
      "src/pages/games/characterSheet/components/ReferenceSidebarContents.tsx",
      "src/pages/games/characterSheet/components/CharacterSection/**/*.{ts,tsx}",
      "src/pages/games/characterSheet/hooks/useImpactsWording.ts",
      "src/pages/games/characterSheet/components/TracksSection/{TracksSection,TrackEditDialog,trackMappings,useRollClockProgress,useTrackCompletionMoves}.{ts,tsx}",
      "src/pages/games/characterSheet/components/CharacterSettingsMenu/CharacterSettingsMenu.tsx",
      "src/components/characters/CharacterInitiativeChip/**/*.{ts,tsx}",
      "src/components/characters/CharacterPortraitAvatar/**/*.{ts,tsx}",
      "src/components/characters/rolls/{Recent,recent,use,roll,copy,clear}*.{ts,tsx}",
    ],
    ignores: [
      "src/ui/**/__stories__/**",
      "src/**/__tests__/**",
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
