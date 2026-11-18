import type { Meta, StoryObj } from "@storybook/react-vite";

import { css } from "styled-system/css";

import { Text } from "../../components/Text";
import { iconGradient, ringGradient, schemeNames, schemes } from "../../theme";
import { pageStyles } from "./foundationStyles";

const meta: Meta = {
  title: "Foundations/Colour schemes",
  parameters: { layout: "fullscreen" },
};
export default meta;

const cardStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
  padding: "4",
  borderRadius: "lg",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  background: "bg.surface",
});

const ringStyles = css({ height: "40px", borderRadius: "md" });
const dotRowStyles = css({ display: "flex", gap: "1.5", alignItems: "center" });
const dotStyles = css({
  width: "28px",
  height: "28px",
  borderRadius: "full",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.subtle",
});

export const AllSchemes: StoryObj = {
  name: "All schemes",
  render: () => (
    <div className={pageStyles}>
      <div>
        <Text variant="eyebrow">Foundations</Text>
        <Text variant="h1">Colour schemes</Text>
        <Text color="muted">
          A player picks one of nine schemes in Iron Link. Each sets the accent
          for light and dark mode and the ring and icon gradients. The grays are
          Zinc in every scheme. Components never name a scheme: they read accent
          and ring tokens, and the Scheme control in the toolbar switches them
          all. In the app, applyUITheme writes data-panda-theme on the html
          element.
        </Text>
      </div>
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "4",
        })}
      >
        {schemeNames.map((name) => {
          const scheme = schemes[name];
          return (
            <div key={name} className={cardStyles}>
              <Text variant="h4" as="h2">
                {scheme.label}
              </Text>
              <div
                className={ringStyles}
                style={{ background: ringGradient(scheme) }}
              />
              <div className={dotRowStyles}>
                <span
                  className={dotStyles}
                  style={{ background: iconGradient(scheme) }}
                  title="Icon gradient"
                />
                <span
                  className={dotStyles}
                  style={{ background: scheme.light.solid }}
                  title="Light accent"
                />
                <span
                  className={dotStyles}
                  style={{ background: scheme.dark.solid }}
                  title="Dark accent"
                />
                <Text variant="caption" color="muted">
                  Icon, light and dark accent
                </Text>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ),
};
