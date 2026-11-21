import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect } from "react";

import "../src/i18n/config";
import { UIProvider } from "../src/ui/components/UIProvider";
import "../src/ui/styles/index.css";
import { schemeNames, schemes } from "../src/ui/theme";
import type { SchemeName, UIColorMode } from "../src/ui/theme";
import { applyUITheme } from "../src/ui/theme";

/** Applies the toolbar's mode and scheme to the page. */
function ThemeSync(props: {
  mode: UIColorMode;
  scheme: SchemeName;
  ringReveal: string;
}) {
  const { mode, scheme, ringReveal } = props;
  useEffect(() => {
    applyUITheme({ mode, scheme });
    document.documentElement.dataset.ringReveal = ringReveal;
  }, [mode, scheme, ringReveal]);
  return null;
}

const withTheme: Decorator = (Story, context) => (
  <UIProvider>
    <ThemeSync
      mode={(context.globals.mode ?? "light") as UIColorMode}
      scheme={(context.globals.scheme ?? "default") as SchemeName}
      ringReveal={(context.globals.ringReveal ?? "fade") as string}
    />
    <Story />
  </UIProvider>
);

const preview: Preview = {
  decorators: [withTheme],
  initialGlobals: {
    mode: "light",
    scheme: "default",
    ringReveal: "fade",
  },
  globalTypes: {
    mode: {
      description: "Colour mode",
      toolbar: {
        title: "Mode",
        icon: "contrast",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
    scheme: {
      description: "Colour scheme",
      toolbar: {
        title: "Scheme",
        icon: "paintbrush",
        items: schemeNames.map((name) => ({
          value: name,
          title: schemes[name].label,
        })),
        dynamicTitle: true,
      },
    },
    ringReveal: {
      description: "How a stat card's ring appears",
      toolbar: {
        title: "Ring reveal",
        icon: "circlehollow",
        items: [
          { value: "fade", title: "Fade" },
          { value: "draw", title: "Draw" },
          { value: "thicken", title: "Thicken" },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: "padded",
    backgrounds: { disable: true },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    a11y: { test: "todo" },
    options: {
      storySort: {
        order: [
          "Introduction",
          "Foundations",
          "Components",
          "Game",
          "Layout",
          "Examples",
        ],
      },
    },
  },
};

export default preview;
