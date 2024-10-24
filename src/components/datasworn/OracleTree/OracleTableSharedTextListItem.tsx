import { Datasworn } from "@datasworn/core";
import OracleTableIcon from "@mui/icons-material/List";
import {
  Box,
  IconButton,
  ListItemText,
  MenuItem,
  TextField,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useOpenDataswornDialog } from "atoms/dataswornDialog.atom";
import { ListItemButtonWithSecondaryAction } from "components/datasworn/OracleTree/ListItemButtonWithSecondaryAction";
import { useRollOracleAndAddToLog } from "pages/games/hooks/useRollOracleAndAddToLog";

export interface OracleTableSharedTextListItemProps {
  collection:
    | Datasworn.OracleTableSharedText
    | Datasworn.OracleTableSharedText2
    | Datasworn.OracleTableSharedText3;
  disabled?: boolean;
}

export function OracleTableSharedTextListItem(
  props: OracleTableSharedTextListItemProps,
) {
  const { collection, disabled } = props;
  const rollOracleTable = useRollOracleAndAddToLog();
  const { t } = useTranslation();
  const openDialog = useOpenDataswornDialog();

  const options = collection.contents ?? {};
  const keys = Object.keys(options);

  const [selectedOption, setSelectedOption] = useState<string>(keys[0] ?? "");

  const selectedOptionId = options[selectedOption]?._id;
  return (
    <ListItemButtonWithSecondaryAction
      disabled={disabled || !selectedOptionId}
      onClick={
        selectedOptionId
          ? () => rollOracleTable(selectedOptionId, true)
          : undefined
      }
      secondaryAction={
        <Box display={"flex"} alignItems={"center"}>
          {keys.length > 0 && (
            <TextField
              aria-label={"Oracle Option"}
              size={"small"}
              select
              sx={{ minWidth: 100 }}
              value={selectedOption}
              onChange={(evt) => {
                setSelectedOption(evt.target.value);
              }}
              disabled={disabled}
            >
              {keys.map((key) => (
                <MenuItem key={key} value={key}>
                  {options[key].name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <Tooltip
            title={t(
              "datasworn.oracle.view-full-table-button",
              "View full table",
            )}
          >
            <span>
              <IconButton
                onClick={() => openDialog(collection._id)}
                disabled={disabled}
              >
                <OracleTableIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      }
    >
      <ListItemText primary={collection.name} />
    </ListItemButtonWithSecondaryAction>
  );
}
