import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
} from "@mui/material";
import { SimpleTreeView, TreeItem } from "@mui/x-tree-view";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import { isValidWorldEntryParent } from "lib/worldEntryParents";

import { IWorldEntry } from "services/worldEntries.service";

const TOP_LEVEL = "top-level";

// Chooses where an entry sits in its category, like moving a note between
// folders. The category's entries show as a tree; the entry itself and
// anything inside it cannot be chosen. The database checks the move again,
// and a refused move raises its own error and leaves the dialog open.
export function WorldEntryMoveDialog({
  entry,
  categoryName,
  onClose,
}: {
  entry: IWorldEntry;
  categoryName: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const setEntryParent = useWorldEntriesStore((store) => store.setEntryParent);
  const [selected, setSelected] = useState<string>(
    entry.parentEntryId ?? TOP_LEVEL,
  );
  const [saving, setSaving] = useState(false);

  // Entries whose parent this client cannot see sit at the top level.
  const siblings = Object.values(entries)
    .filter((candidate) => candidate.categoryId === entry.categoryId)
    .sort((a, b) => a.name.localeCompare(b.name));
  const children: Record<string, IWorldEntry[]> = {};
  const roots: IWorldEntry[] = [];
  for (const candidate of siblings) {
    const parentId = candidate.parentEntryId;
    if (parentId && entries[parentId]?.categoryId === entry.categoryId) {
      (children[parentId] ??= []).push(candidate);
    } else {
      roots.push(candidate);
    }
  }

  const parentId = selected === TOP_LEVEL ? null : selected;
  const unchanged = parentId === (entry.parentEntryId ?? null);

  const renderItem = (candidate: IWorldEntry, seen: Set<string>) => {
    // Existing bad data may already hold a loop; draw each entry once.
    if (seen.has(candidate.id)) return null;
    seen.add(candidate.id);
    return (
      <TreeItem
        key={candidate.id}
        itemId={candidate.id}
        label={candidate.name}
        disabled={!isValidWorldEntryParent(entries, entry.id, candidate.id)}
      >
        {children[candidate.id]?.map((child) => renderItem(child, seen))}
      </TreeItem>
    );
  };
  const seen = new Set<string>();

  const handleSave = async () => {
    setSaving(true);
    try {
      await setEntryParent(entry.id, parentId);
      onClose();
    } catch {
      // The refusal is reported by its own error message.
      setSaving(false);
    }
  };

  return (
    <Dialog open fullWidth maxWidth="xs" onClose={onClose}>
      <DialogTitleWithCloseButton onClose={onClose}>
        {t("worlds.entries.move-title", "Move {{name}}", {
          name: entry.name,
        })}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t(
            "worlds.entries.move-description",
            "Choose where {{name}} sits in {{category}}.",
            { name: entry.name, category: categoryName },
          )}
        </Typography>
        <SimpleTreeView
          aria-label={t("worlds.entries.move-destinations", "Destinations")}
          selectedItems={selected}
          defaultExpandedItems={siblings.map((candidate) => candidate.id)}
          disableSelection={saving}
          onSelectedItemsChange={(_, itemId) => itemId && setSelected(itemId)}
        >
          <TreeItem
            itemId={TOP_LEVEL}
            label={t("worlds.entries.move-top-level", "Top of {{category}}", {
              category: categoryName,
            })}
          />
          {roots.map((root) => renderItem(root, seen))}
        </SimpleTreeView>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          variant="contained"
          disabled={saving || unchanged}
          onClick={handleSave}
        >
          {t("worlds.entries.move", "Move")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
