import { ListItem } from "@/components/common/ListItem";
import { Select } from "@/components/common/TextField";
import { Tooltip } from "@/components/ui/tooltip";
import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import { useGamePermissions } from "@/hooks/usePermissions";
import { useRollOracleAndAddToLog } from "@/hooks/useRollOracleAndAddToLog";
import { useOpenDataswornDialog } from "@/stores/appState.store";
import { GamePermission } from "@/stores/game.store";
import { Box, IconButton } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";
import { Table2Icon } from "lucide-react";
import { useState } from "react";

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
  const t = useDataswornTranslations();
  const openDialog = useOpenDataswornDialog();
  const isGuide = useGamePermissions().gamePermission === GamePermission.Guide;

  const options = collection.contents ?? {};
  const keys = Object.keys(options);

  const [selectedOption, setSelectedOption] = useState<string>(keys[0] ?? "");

  const selectedOptionId = options[selectedOption]?._id;

  return (
    <ListItem
      disabled={disabled || !selectedOptionId}
      onClick={
        selectedOptionId
          ? () => rollOracleTable(selectedOptionId, isGuide)
          : undefined
      }
      label={collection.name}
      secondaryAction={
        <Box display={"flex"} alignItems={"center"}>
          {keys.length > 0 && (
            <Select
              aria-label={t("shared-text-list-item-option", "Oracle Option")}
              size="sm"
              minW={"100px"}
              value={selectedOption}
              onChange={setSelectedOption}
              disabled={disabled}
              options={keys.map((key) => ({
                value: key,
                label: options[key].name,
              }))}
            />
          )}
          <Tooltip
            content={t("oracle.view-full-table-button", "View full table")}
          >
            <span>
              <IconButton
                colorPalette={"gray"}
                variant="ghost"
                onClick={() => openDialog(collection._id)}
                disabled={disabled}
              >
                <Table2Icon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      }
    />
  );
}
