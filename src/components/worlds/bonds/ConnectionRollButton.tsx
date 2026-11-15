import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { Button, Menu, MenuItem } from "@mui/material";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import type { WorldBondMove } from "lib/worldBonds.lib";

// Rolls a progress move against a connection: one button named after the
// move (Starforged's Forge a Bond), or a menu when the rules have several.
export function ConnectionRollButton({
  moves,
  onRoll,
}: {
  moves: WorldBondMove[];
  onRoll: (moveId: string) => void;
}) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();

  if (moves.length === 0) return null;
  if (moves.length === 1) {
    const [move] = moves;
    return (
      <Button
        variant="outlined"
        color="inherit"
        size="small"
        onClick={() => onRoll(move.id)}
      >
        {move.name}
      </Button>
    );
  }
  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        size="small"
        endIcon={<ArrowDropDownIcon />}
        aria-haspopup="menu"
        aria-controls={anchor ? menuId : undefined}
        aria-expanded={anchor ? true : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        {t("worlds.bonds.roll-connection", "Roll progress")}
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
      >
        {moves.map((move) => (
          <MenuItem
            key={move.id}
            onClick={() => {
              setAnchor(null);
              onRoll(move.id);
            }}
          >
            {move.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
