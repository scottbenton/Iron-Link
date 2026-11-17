import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GroupsIcon from "@mui/icons-material/Groups";
import {
  Box,
  ButtonBase,
  Divider,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
} from "@mui/material";
import { useCallback, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";
import { PortraitAvatar } from "components/characters/PortraitAvatar";

import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { pathConfig } from "pages/pathConfig";

import { TOUCH_TARGET_SIZE } from "hooks/useIsTouchDevice";

import { useGameCharacter } from "stores/gameCharacters.store";

import { useGameId } from "../hooks/useGameId";
import { useSortedGameCharacters } from "../hooks/useSortedGameCharacters";

const MENU_ITEM_MIN_HEIGHT = 48;

export interface CharacterSwitcherMenuProps {
  // What the button reads: the open character's name, or the game's.
  title: string;
  isOnCreatePage: boolean;
}

// The phone top bar's title: the open character's portrait and name as a
// button that opens a menu of the game's other characters, the game's
// overview and Add Character. Wider screens have the game's tabs instead.
export function CharacterSwitcherMenu(props: CharacterSwitcherMenuProps) {
  const { title, isOnCreatePage } = props;
  const { t } = useTranslation();

  const gameId = useGameId();
  const characterId = useCharacterIdOptional();
  const characters = useSortedGameCharacters();
  const portraitSettings = useGameCharacter(
    (character) => character?.profileImage,
  );

  const [open, setOpen] = useState(false);
  const closeMenu = useCallback(() => setOpen(false), []);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const isOnOverviewPage = !characterId && !isOnCreatePage;

  return (
    <>
      <ButtonBase
        ref={buttonRef}
        aria-haspopup={"menu"}
        aria-expanded={open ? "true" : undefined}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(true)}
        sx={(theme) => ({
          minWidth: 0,
          maxWidth: "100%",
          minHeight: TOUCH_TARGET_SIZE,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 1,
          px: 0.75,
          borderRadius: `${theme.shape.borderRadius}px`,
          font: "inherit",
          color: "inherit",
          textAlign: "left",
          bgcolor: open ? "action.selected" : undefined,
          "&:hover": { bgcolor: "action.hover" },
          "&.Mui-focusVisible": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        })}
      >
        {characterId && (
          <Box aria-hidden display={"flex"} flexShrink={0}>
            <PortraitAvatar
              characterId={characterId}
              name={title}
              portraitSettings={portraitSettings ?? undefined}
              size={"xsmall"}
              rounded
            />
          </Box>
        )}
        <Box
          component={"span"}
          sx={{
            fontFamily: "fontFamilyTitle",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
          }}
        >
          {title}
        </Box>
        <ExpandMoreIcon
          aria-hidden
          fontSize={"small"}
          sx={(theme) => ({
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : undefined,
            transition: theme.transitions.create("transform", {
              duration: theme.transitions.duration.shortest,
            }),
          })}
        />
      </ButtonBase>
      <Menu
        open={open}
        onClose={closeMenu}
        anchorEl={buttonRef.current}
        slotProps={{
          list: {
            id: menuId,
            "aria-label": t(
              "game.character-switcher.label",
              "Switch character",
            ),
          },
          paper: { sx: { minWidth: 260, maxWidth: "calc(100vw - 32px)" } },
        }}
      >
        <ListSubheader>
          {t("game.character-switcher.characters", "Characters")}
        </ListSubheader>
        {characters.map((character) => {
          const checked = character.id === characterId;
          return (
            <MenuItem
              key={character.id}
              component={LinkComponent}
              href={pathConfig.gameCharacter(gameId, character.id)}
              role={"menuitemradio"}
              aria-checked={checked}
              selected={checked}
              onClick={closeMenu}
              sx={{ minHeight: MENU_ITEM_MIN_HEIGHT + 8, gap: 1.5 }}
            >
              <Box aria-hidden display={"flex"} flexShrink={0}>
                <PortraitAvatar
                  characterId={character.id}
                  name={character.name}
                  portraitSettings={character.profileImage ?? undefined}
                  size={"xsmall"}
                  rounded
                />
              </Box>
              <ListItemText
                primary={character.name ?? t("common.loading", "Loading")}
                slotProps={{
                  primary: { fontWeight: checked ? 600 : undefined },
                }}
              />
              {checked && <CheckIcon aria-hidden color={"primary"} />}
            </MenuItem>
          );
        })}
        <MenuItem
          component={LinkComponent}
          href={pathConfig.gameCharacterCreate(gameId)}
          onClick={closeMenu}
          selected={isOnCreatePage}
          sx={{ minHeight: MENU_ITEM_MIN_HEIGHT }}
        >
          <ListItemIcon>
            <AddIcon />
          </ListItemIcon>
          <ListItemText
            primary={t("game.layout.add-character", "Add Character")}
          />
        </MenuItem>
        <Divider />
        <MenuItem
          component={LinkComponent}
          href={pathConfig.game(gameId)}
          role={"menuitemradio"}
          aria-checked={isOnOverviewPage}
          selected={isOnOverviewPage}
          onClick={closeMenu}
          sx={{ minHeight: MENU_ITEM_MIN_HEIGHT }}
        >
          <ListItemIcon>
            <GroupsIcon />
          </ListItemIcon>
          <ListItemText
            primary={t("game.character-switcher.overview", "Game overview")}
          />
          {isOnOverviewPage && <CheckIcon aria-hidden color={"primary"} />}
        </MenuItem>
      </Menu>
    </>
  );
}
