import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect } from "react";

import "../src/ui/styles/index.css";
import { schemeNames, schemes } from "../src/ui/theme";
import type { SchemeName, UIColorMode } from "../src/ui/theme";
import { applyUITheme } from "../src/ui/theme";
import { UIProvider } from "../src/ui/components/UIProvider";

const withTheme: Decorator = (Story, context) => {
  const mode = (context.globals.mode ?? "light") as UIColorMode;
  const scheme = (context.globals.scheme ?? "default") as SchemeName;
  const ringReveal = (context.globals.ringReveal ?? "fade") as string;

  useEffect(() => {
    applyUITheme({ mode, scheme });
    document.documentElement.dataset.ringReveal = ringReveal;
  }, [mode, scheme, ringReveal]);

  return (
    <UIProvider>
      <Story />
    </UIProvider>
  );
};

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
