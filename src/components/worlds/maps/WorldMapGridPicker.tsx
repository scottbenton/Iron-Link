import { useTranslation } from "react-i18next";

import { RadioCard, RadioCardGroup } from "components/RadioCard";

import { WorldMapGrid } from "lib/worldMap/grid";

import { WorldMapGridPreview } from "./WorldMapGridPreview";
import {
  WORLD_MAP_GRIDS,
  getGridDescription,
  getGridLabel,
} from "./worldMapGrids";

// The grids a map can have, as cards with a drawing of each.
export function WorldMapGridPicker({
  value,
  onChange,
  disabled,
}: {
  value: WorldMapGrid;
  onChange: (grid: WorldMapGrid) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <RadioCardGroup
      label={t("worlds.maps.grid", "Grid")}
      options={WORLD_MAP_GRIDS}
      value={value}
      disabled={disabled}
      onChange={onChange}
      sx={{
        width: "100%",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))",
      }}
      renderCard={(grid, control) => (
        <RadioCard
          {...control}
          title={getGridLabel(t, grid)}
          titleVariant="subtitle1"
          description={getGridDescription(t, grid)}
        >
          <WorldMapGridPreview grid={grid} />
        </RadioCard>
      )}
    />
  );
}
