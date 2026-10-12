import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ShareIcon from "@mui/icons-material/Share";
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { getWorldEntriesLinkingTo } from "lib/worldEntryLinks";

import { IWorldEntry } from "services/worldEntries.service";

import { WorldEntryShareDialog } from "./WorldEntryShareDialog";

export function WorldEntryActionsMenu({
  entry,
  canShare,
  canDelete,
  onDeleted,
  onError,
}: {
  entry: IWorldEntry;
  canShare: boolean;
  canDelete: boolean;
  onDeleted: () => void;
  onError: (cause: unknown) => void;
}) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const definitions = useWorldCategoriesStore(
    (store) => store.fieldDefinitions,
  );
  const deleteEntry = useWorldEntriesStore((store) => store.deleteEntry);

  if (!canShare && !canDelete) return null;

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

  const label = t("worlds.entries.actions", "Entry actions");
  return (
    <>
      <IconButton
        aria-label={label}
        aria-haspopup="menu"
        disabled={deleting}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {canShare && (
          <MenuItem
            onClick={() => {
              setAnchor(null);
              setSharing(true);
            }}
          >
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("worlds.entries.share", "Share")}</ListItemText>
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem onClick={() => handleDelete().catch(onError)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("common.delete", "Delete")}</ListItemText>
          </MenuItem>
        )}
      </Menu>
      {sharing && (
        <WorldEntryShareDialog
          entry={entry}
          onClose={() => setSharing(false)}
        />
      )}
    </>
  );
}
