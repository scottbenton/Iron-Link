import DropdownIcon from "@mui/icons-material/ExpandMore";
import { Box, Chip, ChipProps, Menu, MenuItem } from "@mui/material";
import { useState } from "react";

import { InitiativeStatus } from "api-calls/character/_character.type";

import { useInitiativeStatusText } from "./useInitiativeStatusText";

export interface InitiativeStatusChipProps {
  status: InitiativeStatus;
  handleStatusChange?: (newStatus: InitiativeStatus) => void;
  variant?: "filled" | "outlined";
}

const getStatusProps = (status: InitiativeStatus): Partial<ChipProps> => {
  switch (status) {
    case InitiativeStatus.HasInitiative:
      return {
        color: "success",
      };
    case InitiativeStatus.DoesNotHaveInitiative:
      return {
        color: "error",
      };
    case InitiativeStatus.OutOfCombat:
      return {
        color: "primary",
      };
  }
};

export function InitiativeStatusChip(props: InitiativeStatusChipProps) {
  const { status, handleStatusChange, variant } = props;

  const [menuParent, setMenuParent] = useState<HTMLElement>();

  const onStatusChangeClick = (status: InitiativeStatus) => {
    handleStatusChange?.(status);
    setMenuParent(undefined);
  };

  const statusLabels = useInitiativeStatusText();

  return (
    <span>
      <Chip
        size={"small"}
        label={
          <Box display={"flex"} alignItems={"center"}>
            {statusLabels[status]}
            {handleStatusChange && <DropdownIcon sx={{ ml: 1 }} />}
          </Box>
        }
        variant={variant ?? "filled"}
        onClick={
          handleStatusChange
            ? (evt) => setMenuParent(evt.currentTarget)
            : undefined
        }
        {...getStatusProps(status)}
      />
      <Menu
        open={!!menuParent}
        anchorEl={menuParent}
        onClose={() => setMenuParent(undefined)}
      >
        <MenuItem
          onClick={() => onStatusChangeClick(InitiativeStatus.HasInitiative)}
        >
          {statusLabels[InitiativeStatus.HasInitiative]}
        </MenuItem>
        <MenuItem
          onClick={() =>
            onStatusChangeClick(InitiativeStatus.DoesNotHaveInitiative)
          }
        >
          {statusLabels[InitiativeStatus.DoesNotHaveInitiative]}
        </MenuItem>
        <MenuItem
          onClick={() => onStatusChangeClick(InitiativeStatus.OutOfCombat)}
        >
          {statusLabels[InitiativeStatus.OutOfCombat]}
        </MenuItem>
      </Menu>
    </span>
  );
}
