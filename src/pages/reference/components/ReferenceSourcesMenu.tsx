import FilterIcon from "@mui/icons-material/FilterList";
import {
  Button,
  Checkbox,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { ReferenceSection, ReferenceTab } from "../data/referenceTabs";
import {
  isSourceChecked,
  isSourceShown,
  useReferenceSettings,
} from "../stores/referenceSettings.store";

export interface ReferenceSourcesMenuProps {
  tab: ReferenceTab;
  section: ReferenceSection;
}

// The tab's Sources filter: which expansions show in its lists. It filters
// the lists only, so links to a hidden item still open.
export function ReferenceSourcesMenu(props: ReferenceSourcesMenuProps) {
  const { tab, section } = props;
  const { t } = useTranslation();
  const menuId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const overrides = useReferenceSettings(
    (state) => state.sourceVisibility[tab.id],
  );
  const setSourceVisible = useReferenceSettings(
    (state) => state.setSourceVisible,
  );

  const sources = tab.sources.filter(
    (source) => !source.sections || source.sections.includes(section),
  );

  if (sources.length === 0) return null;

  return (
    <>
      <Button
        color="inherit"
        variant="outlined"
        size="small"
        startIcon={<FilterIcon />}
        aria-haspopup="true"
        aria-expanded={anchor ? "true" : undefined}
        aria-controls={anchor ? menuId : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ flexShrink: 0 }}
      >
        {t("reference.sources.button", "Sources")}
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
      >
        {sources.map((source) => {
          const checked = isSourceChecked(source, overrides);
          // A source whose dependency is off stays ticked but can't show.
          const blocked = checked && !isSourceShown(tab, source, overrides);
          const dependencyLabels = (source.dependsOn ?? [])
            .map((key) => tab.sources.find((s) => s.key === key)?.label)
            .filter((label): label is string => !!label);
          return (
            <MenuItem
              key={source.key}
              role="menuitemcheckbox"
              aria-checked={checked}
              onClick={() => setSourceVisible(tab.id, source.key, !checked)}
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={checked}
                  tabIndex={-1}
                  disableRipple
                  slotProps={{ input: { "aria-hidden": true } }}
                />
              </ListItemIcon>
              <ListItemText
                primary={source.label}
                secondary={
                  blocked
                    ? t(
                        "reference.sources.needs",
                        "Shows when {{sources}} is on",
                        { sources: dependencyLabels.join(", ") },
                      )
                    : undefined
                }
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
