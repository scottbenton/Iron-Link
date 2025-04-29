import { ListItem } from "@/components/common/ListItem";
import { Tooltip } from "@/components/ui/tooltip";
import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import { useGamePermissions } from "@/hooks/usePermissions";
import { useRollOracleAndAddToLog } from "@/hooks/useRollOracleAndAddToLog";
import { useOpenDataswornDialog } from "@/stores/appState.store";
import { GamePermission } from "@/stores/game.store";
import { IconButton } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";
import { Table2Icon } from "lucide-react";

import {
  CollectionVisibility,
  ItemVisibility,
  VisibilitySettings,
} from "../getCollectionVisibility";

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

  const t = useDataswornTranslations();
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
    <ListItem
      disabled={disabled}
      onClick={() => rollOracle(oracle._id, isGuide)}
      label={oracle.name}
      secondaryAction={
        <Tooltip
          content={t("oracle.view-full-table-button", "View full table")}
        >
          <span>
            <IconButton
              colorPalette={"gray"}
              variant="ghost"
              onClick={() => openDialog(oracle._id)}
              disabled={disabled}
            >
              <Table2Icon />
            </IconButton>
          </span>
        </Tooltip>
      }
    />
  );
}
