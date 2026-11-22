import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { css } from "styled-system/css";

import { sampleAssets } from "../../docs/fixtures/datasworn";
import { AssetCard } from "../../game/AssetCard";
import type { AssetCardState } from "../../game/AssetCard/assetData";
import { capitalize } from "../../game/shared/format";
import { usePreviewRolls } from "./previewRolls";

const page = css({
  minHeight: "100dvh",
  display: "grid",
  placeItems: "start center",
  paddingBlock: { base: "6", sm: "10" },
  paddingInline: "4",
  overflowX: "hidden",
  background: "bg.surface",
  boxSizing: "border-box",
});

/** The three cards share one grid cell, so the side cards sit behind. */
const hand = css({
  display: "grid",
  width: "360px",
  maxWidth: "100%",
  "& > *": { gridArea: "1 / 1", minWidth: 0 },
});

const sideCard = css({
  // Fanned out from a point below the cards, like a hand of cards.
  transformOrigin: "50% 140%",
  opacity: 0.55,
  pointerEvents: "none",
  userSelect: "none",
  "&[data-side=start]": {
    transform: "translateX(-24%) rotate(-7deg) scale(0.94)",
  },
  "&[data-side=end]": {
    transform: "translateX(24%) rotate(7deg) scale(0.94)",
  },
});

const centerCard = css({
  position: "relative",
  zIndex: 1,
  borderRadius: "lg",
  boxShadow: "float",
});

function Starship() {
  const { roll } = usePreviewRolls();
  const [state, setState] = useState<AssetCardState>({
    optionValues: { name: "Wayfinder" },
  });
  return (
    <AssetCard
      asset={sampleAssets.starship}
      state={state}
      onAbilityToggle={(index, enabled) =>
        setState((current) => ({
          ...current,
          enabledAbilities: { ...current.enabledAbilities, [index]: enabled },
        }))
      }
      onOptionChange={(key, value) =>
        setState((current) => ({
          ...current,
          optionValues: { ...current.optionValues, [key]: value },
        }))
      }
      onControlChange={(key, value) =>
        setState((current) => ({
          ...current,
          controlValues: { ...current.controlValues, [key]: value },
        }))
      }
      onRollControl={(_key, control, value) => {
        roll(capitalize(control.label), value);
      }}
    />
  );
}

function AssetCardsPreview() {
  return (
    <div className={page}>
      <div className={hand}>
        {/* Scenery only: out of the tab order and the accessibility tree. */}
        <div className={sideCard} data-side="start" inert aria-hidden>
          <AssetCard asset={sampleAssets.ace} readOnly />
        </div>
        <div className={sideCard} data-side="end" inert aria-hidden>
          <AssetCard
            asset={sampleAssets.protocolBot}
            state={{ optionValues: { name: "Tock" } }}
            readOnly
          />
        </div>
        <div className={centerCard}>
          <Starship />
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "Previews/Asset Cards",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Starforged assets: the Starship to name, tick and roll, with a path and a
 * companion fanned out behind it.
 */
export const Starforged: Story = {
  render: () => <AssetCardsPreview />,
};
