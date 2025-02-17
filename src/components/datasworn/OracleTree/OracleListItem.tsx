import { Datasworn } from "@datasworn/core";
import OracleTableIcon from "@mui/icons-material/List";
import { IconButton, ListItemText, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";
import { useRollOracleAndAddToLog } from "pages/games/hooks/useRollOracleAndAddToLog";

import { useOpenDataswornDialog } from "stores/appState.store";
import { GamePermission } from "stores/game.store";

import {
  CollectionVisibility,
  ItemVisibility,
  VisibilitySettings,
} from "../_helpers/getCollectionVisibility";
import { ListItemButtonWithSecondaryAction } from "./ListItemButtonWithSecondaryAction";

export interface OracleListItemProps {
  oracle: Datasworn.OracleRollable;
  disabled?: boolean;
  visibilitySettings: VisibilitySettings;
  isSearchActive: boolean;
  isFullCollectionVisible: boolean;
}

export function OracleListItem(props: OracleListItemProps) {
  const {
    oracle,
    disabled,
    visibilitySettings,
    isSearchActive,
    isFullCollectionVisible,
  } = props;

  const { t } = useTranslation();
  const openDialog = useOpenDataswornDialog();

  const rollOracle = useRollOracleAndAddToLog();
  const isGuide = useGamePermissions().gamePermission === GamePermission.Guide;

  let oracleVisibility = ItemVisibility.Visible;
  if (isSearchActive && !isFullCollectionVisible) {
    oracleVisibility =
      visibilitySettings.itemVisibility[oracle._id] ??
      CollectionVisibility.Hidden;
  }

  if (oracleVisibility === ItemVisibility.Hidden) {
    return null;
  }

  return (
    <ListItemButtonWithSecondaryAction
      secondaryAction={
        <Tooltip
          title={t(
            "datasworn.oracle.view-full-table-button",
            "View full table",
          )}
        >
          <span>
            <IconButton
              onClick={() => openDialog(oracle._id)}
              disabled={disabled}
            >
              <OracleTableIcon />
            </IconButton>
          </span>
        </Tooltip>
      }
      disabled={disabled}
      onClick={() => rollOracle(oracle._id, isGuide)}
    >
      <ListItemText primary={oracle.name} />
    </ListItemButtonWithSecondaryAction>
  );
}
