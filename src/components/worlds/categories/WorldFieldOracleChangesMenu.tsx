import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { useSetAnnouncement } from "stores/appState.store";
import { useWorldOracleChangesStore } from "stores/worldOracleChanges.store";

import type { IWorldOracleChange } from "services/worldOracleChanges.service";

export interface WorldFieldOracleChangesMenuProps {
  label: string;
  changes: IWorldOracleChange[];
  disabled: boolean;
  onChooseAnother: () => void;
}

// The fixes for a field whose saved oracle moved: keep following the
// playsets (accept the new oracle), pin the old one, or pick another in the
// field editor. Each fix applies to every flagged binding of the field.
export function WorldFieldOracleChangesMenu(
  props: WorldFieldOracleChangesMenuProps,
) {
  const { label, changes, disabled, onChooseAnother } = props;
  const { t } = useTranslation();
  const menuId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [saving, setSaving] = useState(false);
  const resolveChange = useWorldOracleChangesStore(
    (store) => store.resolveChange,
  );
  const announce = useSetAnnouncement();
  const { error } = useSnackbar();

  const buttonLabel = t(
    "worlds.oracle-changes.fix-label",
    "Fix oracle change for {{label}}",
    { label },
  );

  const resolve = (keepPrevious: boolean) => {
    setAnchor(null);
    setSaving(true);
    Promise.all(changes.map((change) => resolveChange(change.id, keepPrevious)))
      .then(() => {
        announce(
          keepPrevious
            ? t(
                "worlds.oracle-changes.kept-old",
                "{{label}} rolls its old oracle again",
                { label },
              )
            : t(
                "worlds.oracle-changes.following",
                "{{label}} follows the playsets",
                { label },
              ),
        );
      })
      .catch(() => {
        error(
          t("worlds.oracle-changes.fix-failed", "Could not update {{label}}", {
            label,
          }),
        );
      })
      .finally(() => setSaving(false));
  };

  return (
    <>
      <Tooltip title={buttonLabel}>
        <span>
          <IconButton
            color="warning"
            aria-label={buttonLabel}
            aria-haspopup="menu"
            aria-controls={anchor ? menuId : undefined}
            aria-expanded={anchor ? "true" : undefined}
            disabled={disabled || saving}
            onClick={(event) => setAnchor(event.currentTarget)}
            sx={{ mr: 1 }}
          >
            <WarningAmberIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
      >
        <MenuItem onClick={() => resolve(false)}>
          {t("worlds.oracle-changes.follow-playsets", "Follow the playsets")}
        </MenuItem>
        <MenuItem onClick={() => resolve(true)}>
          {t("worlds.oracle-changes.always-old", "Always roll the old oracle")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onChooseAnother();
          }}
        >
          {t("worlds.oracle-changes.choose-another", "Choose another oracle")}
        </MenuItem>
      </Menu>
    </>
  );
}
