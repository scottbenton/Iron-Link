import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/ui/docs/**/*.mdx", "../src/ui/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
};

export default config;
