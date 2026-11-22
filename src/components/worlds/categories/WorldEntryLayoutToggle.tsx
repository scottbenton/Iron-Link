import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import { ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useIsTouchDevice } from "hooks/useIsTouchDevice";

import {
  WorldEntryLayout,
  useWorldEntryLayout,
  useWorldEntryLayoutStore,
} from "stores/worldEntryLayout.store";

import { IWorldCategory } from "services/worldCategories.service";

// Chooses whether a category's entries show as a grid of cards or as a list,
// which is a tree in categories that nest. Remembered per category on this
// device; an entry's Places follow its category's choice.
export function WorldEntryLayoutToggle({
  category,
}: {
  category: Pick<IWorldCategory, "id" | "supportsHierarchy">;
}) {
  const { t } = useTranslation();
  const touch = useIsTouchDevice();
  const layout = useWorldEntryLayout(category);
  const setLayout = useWorldEntryLayoutStore((state) => state.setLayout);
  const gridLabel = t("worlds.categories.layout-grid", "Grid view");
  const listLabel = t("worlds.categories.layout-list", "List view");
  const buttonSx = touch ? { minWidth: 44, minHeight: 44 } : undefined;

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={layout}
      aria-label={t("worlds.categories.layout", "Layout")}
      onChange={(_, next: WorldEntryLayout | null) =>
        next && setLayout(category.id, next)
      }
      sx={{ flexShrink: 0, bgcolor: "background.paper" }}
    >
      <Tooltip title={gridLabel}>
        <ToggleButton value="grid" aria-label={gridLabel} sx={buttonSx}>
          <ViewModuleIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title={listLabel}>
        <ToggleButton value="list" aria-label={listLabel} sx={buttonSx}>
          <ViewListIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
}
