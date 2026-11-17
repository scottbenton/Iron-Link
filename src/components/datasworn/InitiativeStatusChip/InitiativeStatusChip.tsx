import DropdownIcon from "@mui/icons-material/ExpandMore";
import { Box, Chip, ChipProps, Menu, MenuItem } from "@mui/material";
import { useId, useState } from "react";

import { InitiativeStatus } from "repositories/character.repository";

import {
  getInitiativeStatusFill,
  initiativeStatusColors,
} from "./initiativeStatusColors";
import { useInitiativeStatusText } from "./useInitiativeStatusText";

export interface InitiativeStatusChipProps {
  status: InitiativeStatus;
  handleStatusChange?: (newStatus: InitiativeStatus) => void;
  variant?: "filled" | "outlined";
}

const getStatusProps = (status: InitiativeStatus): Partial<ChipProps> => {
  const color = initiativeStatusColors[status];
  if (color !== "neutral") return { color };
  // MUI's default chip is too faint to read as a status, so the neutral one
  // is filled like the others.
  return {
    color: "default",
    sx: (theme) => {
      const fill = getInitiativeStatusFill(theme, status);
      return {
        bgcolor: fill.main,
        color: fill.contrastText,
        "&.MuiChip-clickable:hover, &.Mui-focusVisible": {
          bgcolor: fill.dark,
        },
      };
    },
  };
};

export function InitiativeStatusChip(props: InitiativeStatusChipProps) {
  const { status, handleStatusChange, variant } = props;

  const [menuParent, setMenuParent] = useState<HTMLElement>();
  const menuId = useId();

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
        {...(handleStatusChange && {
          "aria-haspopup": "menu" as const,
          "aria-expanded": menuParent ? ("true" as const) : undefined,
          "aria-controls": menuParent ? menuId : undefined,
        })}
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
        slotProps={{ list: { id: menuId } }}
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
