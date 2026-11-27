import BackspaceIcon from "@mui/icons-material/Backspace";
import RerollIcon from "@mui/icons-material/Casino";
import CopyIcon from "@mui/icons-material/CopyAll";
import MoreIcon from "@mui/icons-material/MoreHoriz";
import MomentumIcon from "@mui/icons-material/Whatshot";
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  canChangeRoll,
  getRollActionAvailability,
} from "components/characters/rolls/rollActions";
import { useRollActionRunner } from "components/characters/rolls/useRollActionRunner";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useUID } from "stores/auth.store";
import { GamePermission } from "stores/game.store";
import { useCharacterAccess } from "stores/gameCharacters.store";

import { RollType } from "repositories/shared.types";

import { IGameLogRoll } from "services/gameLog.service";

import { DieRerollDialog } from "./DieRerollDialog";

export interface NormalRollActionsProps {
  rollId: string;
  roll: IGameLogRoll;
}

export function NormalRollActions(props: NormalRollActionsProps) {
  const { rollId, roll } = props;
  const { t } = useTranslation();

  const uid = useUID();
  const runner = useRollActionRunner();
  const canEditRollCharacter = useCharacterAccess(roll.characterId).canEdit;
  const canDeleteRolls =
    useGamePermissions().gamePermission === GamePermission.Guide;

  const available = getRollActionAvailability(roll, {
    canChangeRoll: canChangeRoll(roll, uid, canEditRollCharacter),
    canDeleteRolls,
    currentCharacterId: runner.currentCharacterId,
    momentum: runner.momentum,
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuParent = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const [isDieRerollDialogOpen, setIsDieRerollDialogOpen] = useState(false);

  const handleCopyRoll = () => runner.copy(roll);

  return (
    <>
      <IconButton
        aria-label={t("game.log.copy-roll", "Copy roll result")}
        color={"inherit"}
        onClick={() => {
          handleCopyRoll();
        }}
      >
        <CopyIcon />
      </IconButton>
      <IconButton
        aria-label={t("game.log.roll-actions", "Roll actions")}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen ? "true" : undefined}
        aria-controls={isMenuOpen ? menuId : undefined}
        color={"inherit"}
        ref={menuParent}
        onClick={() => {
          setIsMenuOpen(true);
        }}
      >
        <MoreIcon />
      </IconButton>
      {isMenuOpen && (
        <Menu
          sx={{
            zIndex: 10001,
          }}
          open={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          anchorEl={menuParent.current}
          slotProps={{ list: { id: menuId } }}
        >
          <MenuItem
            onClick={(evt) => {
              evt.stopPropagation();
              handleCopyRoll();
              setIsMenuOpen(false);
            }}
          >
            <ListItemIcon>
              <CopyIcon />
            </ListItemIcon>
            <ListItemText>
              {t("game.log.copy-roll-result", "Copy Roll Result")}
            </ListItemText>
          </MenuItem>
          {available.reroll && (
            <MenuItem
              onClick={(evt) => {
                evt.stopPropagation();
                setIsMenuOpen(false);
                setIsDieRerollDialogOpen(true);
              }}
            >
              <ListItemIcon>
                <RerollIcon />
              </ListItemIcon>
              <ListItemText>
                {t("game.log.reroll-die", "Reroll Die")}
              </ListItemText>
            </MenuItem>
          )}
          {available.burnMomentum && (
            <MenuItem
              onClick={(evt) => {
                evt.stopPropagation();
                setIsMenuOpen(false);
                runner.burnMomentum(rollId, roll);
              }}
            >
              <ListItemIcon>
                <MomentumIcon />
              </ListItemIcon>
              <ListItemText>
                {t("game.log.burn-momentum", "Burn Momentum")}
              </ListItemText>
            </MenuItem>
          )}
          {available.delete && (
            <MenuItem
              onClick={(evt) => {
                evt.stopPropagation();
                setIsMenuOpen(false);
                runner.deleteRoll(rollId);
              }}
            >
              <ListItemIcon>
                <BackspaceIcon />
              </ListItemIcon>
              <ListItemText>
                {t("game.log.delete-roll", "Delete Roll")}
              </ListItemText>
            </MenuItem>
          )}
        </Menu>
      )}
      {roll.type === RollType.Stat && (
        <DieRerollDialog
          open={isDieRerollDialogOpen}
          handleClose={() => setIsDieRerollDialogOpen(false)}
          rollId={rollId}
          roll={roll}
        />
      )}
    </>
  );
}
