import { css } from "styled-system/css";

import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import { sampleAssets } from "../../docs/fixtures/datasworn";
import { AssetCard } from "../../game/AssetCard";
import { stackStyles } from "./playLayoutsShared";

/**
 * The character's assets, as many to a row as fit at 300px: one in a side
 * column, two or three across a main column.
 */
export function Assets(props: { compact?: boolean; headingAs?: "h3" | "h4" }) {
  const { compact, headingAs = "h3" } = props;
  return (
    <div className={stackStyles}>
      <div className={assetActionsStyles}>
        <Checkbox label="Show all abilities" size="sm" />
        <Button size="sm" variant="outline">
          Add Assets
        </Button>
      </div>
      <div className={compact ? stackStyles : assetGridStyles}>
        <AssetCard
          asset={sampleAssets.starship}
          state={{ controlValues: { integrity: 4 } }}
          headingAs={headingAs}
          collapsed={compact}
        />
        <AssetCard
          asset={sampleAssets.ace}
          headingAs={headingAs}
          collapsed={compact}
        />
        <AssetCard
          asset={sampleAssets.navigator}
          headingAs={headingAs}
          collapsed={compact}
        />
      </div>
    </div>
  );
}

const assetActionsStyles = css({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "2",
});

const assetGridStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
  gap: "3",
});
