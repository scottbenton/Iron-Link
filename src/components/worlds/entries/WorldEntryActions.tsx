import AddPhotoIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import DriveFileMoveIcon from "@mui/icons-material/DriveFileMove";
import HideImageIcon from "@mui/icons-material/HideImage";
import InterestsIcon from "@mui/icons-material/Interests";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ShareIcon from "@mui/icons-material/Share";
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { getWorldEntriesLinkingTo } from "lib/worldEntryLinks";

import { IWorldEntry } from "services/worldEntries.service";

import { WorldCategoryIconDialog } from "../categories/WorldCategoryIconDialog";
import { WorldEntryMoveDialog } from "./WorldEntryMoveDialog";
import { WorldEntryRollEmptyButton } from "./WorldEntryRollEmptyButton";
import { WorldEntryShareDialog } from "./WorldEntryShareDialog";
import { useWorldEntryImage } from "./useWorldEntryImage";

// An entry's actions. In the strip on its page, Share is a button and More
// holds the rest; on its card in a list, everything is in one menu. Move to
// is offered only in categories that nest entries. People who can edit the
// entry get Roll empty fields and, in More, the image items: clicking the
// picture itself is for viewing it.
export function WorldEntryActions({
  entry,
  variant = "strip",
  categoryName,
  canShare,
  canMove = false,
  canEdit = false,
  canDelete,
  onDeleted,
  onError,
}: {
  entry: IWorldEntry;
  variant?: "strip" | "card";
  categoryName: string;
  canShare: boolean;
  canMove?: boolean;
  canEdit?: boolean;
  canDelete: boolean;
  onDeleted: () => void;
  onError: (cause: unknown) => void;
}) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [sharing, setSharing] = useState(false);
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [choosingIcon, setChoosingIcon] = useState(false);
  const updateEntry = useWorldEntriesStore((store) => store.updateEntry);
  const definitions = useWorldCategoriesStore(
    (store) => store.fieldDefinitions,
  );
  const deleteEntry = useWorldEntriesStore((store) => store.deleteEntry);
  const image = useWorldEntryImage(entry, onError);

  const card = variant === "card";
  const showEditActions = !card && canEdit;
  if (!canShare && !canMove && !canDelete && !showEditActions) return null;

  const handleDelete = async () => {
    setAnchor(null);
    // Read at click time: nothing else here needs every value in the world.
    const { entryState, fieldValueState } = useWorldEntriesStore.getState();
    const linking = getWorldEntriesLinkingTo(
      entry,
      definitions,
      fieldValueState.valuesByEntry,
      entryState.entries,
    );
    const { confirmed } = await confirm({
      title: t("worlds.entries.delete", "Delete entry"),
      description:
        linking.length === 1
          ? t(
              "worlds.entries.delete-confirmation-linked-once",
              'Delete "{{name}}"? {{name}} is linked from 1 entry: {{entries}}. That link will be removed. This cannot be undone.',
              { name: entry.name, entries: linking[0].name },
            )
          : linking.length
            ? t(
                "worlds.entries.delete-confirmation-linked",
                'Delete "{{name}}"? {{name}} is linked from {{count}} entries: {{entries}}. Those links will be removed. This cannot be undone.',
                {
                  name: entry.name,
                  count: linking.length,
                  entries: linking.map((linked) => linked.name).join(", "),
                },
              )
            : t(
                "worlds.entries.delete-confirmation",
                'Delete "{{name}}"? This cannot be undone.',
                { name: entry.name },
              ),
      confirmationText: t("common.delete", "Delete"),
    });
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteEntry(entry.id);
      onDeleted();
    } catch (cause) {
      setDeleting(false);
      onError(cause);
    }
  };

  const shareLabel = t("worlds.entries.share", "Share");
  const moreLabel = t("worlds.entries.actions", "More");
  const shareItem = (
    <MenuItem
      onClick={() => {
        setAnchor(null);
        setSharing(true);
      }}
    >
      <ListItemIcon>
        <ShareIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>{shareLabel}</ListItemText>
    </MenuItem>
  );
  const moveItem = (
    <MenuItem
      onClick={() => {
        setAnchor(null);
        setMoving(true);
      }}
    >
      <ListItemIcon>
        <DriveFileMoveIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>{t("worlds.entries.move-to", "Move to")}</ListItemText>
    </MenuItem>
  );
  const deleteItem = (
    <MenuItem onClick={() => handleDelete().catch(onError)}>
      <ListItemIcon>
        <DeleteIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>{t("common.delete", "Delete")}</ListItemText>
    </MenuItem>
  );
  const imageItems = image.hasImage
    ? [
        <MenuItem
          key="change-image"
          disabled={image.busy}
          onClick={() => {
            setAnchor(null);
            image.choose();
          }}
        >
          <ListItemIcon>
            <AddPhotoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {t("worlds.entries.change-image", "Change image")}
          </ListItemText>
        </MenuItem>,
        <MenuItem
          key="remove-image"
          disabled={image.busy}
          onClick={() => {
            setAnchor(null);
            image.remove();
          }}
        >
          <ListItemIcon>
            <HideImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {t("worlds.entries.remove-image", "Remove image")}
          </ListItemText>
        </MenuItem>,
      ]
    : [
        <MenuItem
          key="add-image"
          disabled={image.busy}
          onClick={() => {
            setAnchor(null);
            image.choose();
          }}
        >
          <ListItemIcon>
            <AddPhotoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {t("worlds.entries.add-image", "Add image")}
          </ListItemText>
        </MenuItem>,
      ];
  const iconItem = (
    <MenuItem
      key="choose-icon"
      onClick={() => {
        setAnchor(null);
        setChoosingIcon(true);
      }}
    >
      <ListItemIcon>
        <InterestsIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>
        {t("worlds.entries.choose-icon", "Choose icon")}
      </ListItemText>
    </MenuItem>
  );
  const hasMenu = card || showEditActions || canMove || canDelete;
  return (
    <>
      {!card && canShare && (
        <Tooltip title={shareLabel}>
          <IconButton aria-label={shareLabel} onClick={() => setSharing(true)}>
            <ShareIcon />
          </IconButton>
        </Tooltip>
      )}
      {showEditActions && (
        <WorldEntryRollEmptyButton entry={entry} onError={onError} />
      )}
      {!card && <Box sx={{ flexGrow: 1 }} />}
      {hasMenu && (
        <>
          <Tooltip title={card ? "" : moreLabel}>
            <IconButton
              aria-label={
                card
                  ? t("worlds.entries.actions-named", "{{name}} actions", {
                      name: entry.name,
                    })
                  : moreLabel
              }
              aria-haspopup="menu"
              size={card ? "small" : "medium"}
              disabled={deleting}
              onClick={(event) => setAnchor(event.currentTarget)}
            >
              {card ? <MoreHorizIcon /> : <MoreVertIcon />}
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchor}
            open={!!anchor}
            onClose={() => setAnchor(null)}
          >
            {card && canShare && shareItem}
            {showEditActions && iconItem}
            {showEditActions && imageItems}
            {canMove && moveItem}
            {canDelete && deleteItem}
          </Menu>
        </>
      )}
      {showEditActions && image.input}
      {choosingIcon && (
        <WorldCategoryIconDialog
          value={entry.icon}
          title={t("worlds.entries.choose-icon-title", "Choose entry icon")}
          onSave={(icon) => {
            updateEntry(entry.id, { icon }).catch(onError);
          }}
          onClose={() => setChoosingIcon(false)}
        />
      )}
      {moving && (
        <WorldEntryMoveDialog
          entry={entry}
          categoryName={categoryName}
          onClose={() => setMoving(false)}
        />
      )}
      {sharing && (
        <WorldEntryShareDialog
          entry={entry}
          onClose={() => setSharing(false)}
        />
      )}
    </>
  );
}
