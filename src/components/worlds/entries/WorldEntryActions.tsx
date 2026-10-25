import AddPhotoIcon from "@mui/icons-material/AddPhotoAlternate";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import DriveFileMoveIcon from "@mui/icons-material/DriveFileMove";
import GroupsIcon from "@mui/icons-material/Groups";
import HideImageIcon from "@mui/icons-material/HideImage";
import InterestsIcon from "@mui/icons-material/Interests";
import LockIcon from "@mui/icons-material/Lock";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
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

import { WorldIconPickerDialog } from "../WorldIconPickerDialog";
import { WorldEntryMoveDialog } from "./WorldEntryMoveDialog";
import { WorldEntryRollEmptyButton } from "./WorldEntryRollEmptyButton";
import { useWorldEntryImage } from "./useWorldEntryImage";
import {
  WorldEntryVisibility,
  getWorldEntryVisibility,
  getWorldEntryVisibilityPermissions,
} from "./worldEntryPermissions";

// An entry's actions. In the strip on its page, who can see it is a button
// and More holds the rest; on its card in a list, everything is in one menu. Move to
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
  const [visibilityAnchor, setVisibilityAnchor] = useState<HTMLElement | null>(
    null,
  );
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

  const moreLabel = t("worlds.entries.actions", "More");
  const visibility = getWorldEntryVisibility(entry.readPermissions);
  const visibilityLabels: Record<WorldEntryVisibility, string> = {
    guides: t("worlds.entries.visibility.guides", "Guides only"),
    everyone: t("worlds.entries.visibility.everyone", "Everyone"),
  };
  const visibilityTitle = t("worlds.entries.visibility.title", "Visible to");
  const setVisibility = (next: WorldEntryVisibility) => {
    setAnchor(null);
    setVisibilityAnchor(null);
    if (next === visibility) return;
    updateEntry(entry.id, getWorldEntryVisibilityPermissions(next)).catch(
      onError,
    );
  };
  const visibilityItems = (["guides", "everyone"] as const).map((option) => (
    <MenuItem
      key={option}
      selected={option === visibility}
      onClick={() => setVisibility(option)}
    >
      <ListItemIcon>
        {option === visibility && <CheckIcon fontSize="small" />}
      </ListItemIcon>
      <ListItemText>{visibilityLabels[option]}</ListItemText>
    </MenuItem>
  ));
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
        <>
          <Button
            color="inherit"
            startIcon={visibility === "guides" ? <LockIcon /> : <GroupsIcon />}
            aria-haspopup="menu"
            aria-label={`${visibilityTitle}: ${visibilityLabels[visibility]}`}
            onClick={(event) => setVisibilityAnchor(event.currentTarget)}
          >
            {visibilityLabels[visibility]}
          </Button>
          <Menu
            anchorEl={visibilityAnchor}
            open={!!visibilityAnchor}
            onClose={() => setVisibilityAnchor(null)}
            MenuListProps={{
              subheader: <ListSubheader>{visibilityTitle}</ListSubheader>,
            }}
          >
            {visibilityItems}
          </Menu>
        </>
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
            {card &&
              canShare && [
                <ListSubheader key="visibility">
                  {visibilityTitle}
                </ListSubheader>,
                ...visibilityItems,
                ...(canMove || canDelete
                  ? [<Divider key="visibility-divider" />]
                  : []),
              ]}
            {showEditActions && iconItem}
            {showEditActions && imageItems}
            {canMove && moveItem}
            {canDelete && deleteItem}
          </Menu>
        </>
      )}
      {showEditActions && image.input}
      {choosingIcon && (
        <WorldIconPickerDialog
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
    </>
  );
}
