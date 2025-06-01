import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Divider, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { GridLayout } from "components/Layout";
import { EmptyState } from "components/Layout/EmptyState";

import { useNotesStore } from "stores/notes.store";

import { i18n } from "i18n/config";

import { INoteFolder } from "services/noteFolders.service";
import { INote } from "services/notes.service";

import { FolderItem } from "./FolderItem";
import { NoteItem } from "./NoteItem";
import { SortableNoteItem } from "./SortableNoteItem";
import { getItemName } from "./getFolderName";
import { useFolderPermission } from "./useFolderPermissions";

export interface FolderViewProps {
  folderId: string | undefined;
  isRootFolder?: boolean;
}
export function FolderView(props: FolderViewProps) {
  const { folderId, isRootFolder } = props;

  const { t } = useTranslation();

  const { canEdit } = useFolderPermission(folderId);

  const subFolders = useNotesStore((state) => {
    if (!folderId) {
      return Object.entries(state.folderState.folders).filter(([, folder]) => {
        const parentId = folder.parentFolderId;
        if (parentId === null) {
          return false;
        }
        if (!state.folderState.folders[parentId]) {
          return true;
        }
        return false;
      });
    }

    const folders = Object.entries(state.folderState.folders)
      .filter(([, folder]) => folder.parentFolderId === folderId)
      .sort(sortFolders);

    // add a new folder at position 0 if we can edit
    if (isRootFolder) {
      folders.unshift([
        "world",
        {
          id: "world",
          name: t("notes.world-folder", "World"),
          parentFolderId: folderId,
          isRootPlayerFolder: false,
        } as INoteFolder,
      ]);
    }

    return folders;
  });

  const { sortedNoteIds, noteMap } = useNotesStore((state) => {
    const sortedNoteIds: string[] = [];
    const noteMap: Record<string, INote> = {};

    if (!folderId) {
      Object.entries(state.noteState.notes).forEach(([noteId, note]) => {
        const parentFolderId = note.parentFolderId;
        const parentFolder = state.folderState.folders[parentFolderId];
        if (!parentFolder) {
          sortedNoteIds.push(noteId);
          noteMap[noteId] = note;
        }
      });
    } else {
      Object.entries(state.noteState.notes).forEach(([noteId, note]) => {
        if (note.parentFolderId === folderId) {
          sortedNoteIds.push(noteId);
          noteMap[noteId] = note;
        }
      });
    }

    sortedNoteIds.sort((a, b) => {
      if (folderId) {
        return noteMap[a].order - noteMap[b].order;
      } else {
        return noteMap[a].title.localeCompare(noteMap[b].title);
      }
    });

    return {
      sortedNoteIds,
      noteMap,
    };
  });

  // localally sorted nodes allows us to show updates immediately
  const [localSortedNodes, setLocalSortedNodes] = useState(sortedNoteIds);
  useEffect(() => {
    setLocalSortedNodes(sortedNoteIds);
  }, [sortedNoteIds]);

  const updateNoteOrder = useNotesStore((state) => state.updateNoteOrder);
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeId = event.active.id as string;
      const overId = event.over?.id as string;

      if (!overId) {
        return;
      }

      if (activeId !== overId) {
        // Find the index of the new position
        const overIndex = localSortedNodes.indexOf(overId);
        const activeIndex = localSortedNodes.indexOf(activeId);

        if (overIndex < 0 || activeIndex < 0) {
          return;
        }

        const overOrder = noteMap[overId].order;
        let otherSideOrder: number;
        if (overIndex > activeIndex) {
          // We are moving the note back in the list, so we need the note after's order
          otherSideOrder =
            overIndex + 1 === localSortedNodes.length
              ? overOrder + 2
              : noteMap[localSortedNodes[overIndex + 1]].order;
        } else {
          // We are moving the note forward in the list, so we need the note before's order
          otherSideOrder =
            overIndex === 0
              ? overOrder - 2
              : noteMap[localSortedNodes[overIndex - 1]].order;
        }
        const updatedOrder = (overOrder + otherSideOrder) / 2;

        // Setting this locally so we can update the UI immediately
        setLocalSortedNodes((prev) => {
          return arrayMove(prev, activeIndex, overIndex);
        });

        updateNoteOrder(activeId, updatedOrder);
      }
    },
    [noteMap, localSortedNodes, updateNoteOrder],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <>
      {folderId === undefined &&
        (subFolders.length > 0 || sortedNoteIds.length > 0) && (
          <>
            <Divider sx={{ mt: 4, mb: 1 }} />
            <Typography variant="overline" px={1}>
              {t("notes.shared-with-me", "Shared with you")}
            </Typography>
          </>
        )}
      {subFolders.length > 0 && (
        <GridLayout
          sx={{ mb: 1 }}
          gap={1}
          items={subFolders}
          minWidth={200}
          renderItem={([subFolderId, subFolder]) => (
            <FolderItem
              key={subFolderId}
              folderId={subFolderId}
              folder={subFolder}
            />
          )}
        />
      )}
      {subFolders.length === 0 && sortedNoteIds.length === 0 && folderId && (
        <EmptyState
          title={t("notes.empty-folder", "Empty Folder")}
          message={t(
            "notes.empty-folder-description",
            "This folder has no contents yet.",
          )}
          sx={{ py: 2 }}
        />
      )}
      {folderId && canEdit ? (
        <DndContext
          collisionDetection={closestCenter}
          sensors={sensors}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedNoteIds}
            strategy={verticalListSortingStrategy}
          >
            {sortedNoteIds.map((noteId) => (
              <SortableNoteItem
                key={noteId}
                id={noteId}
                note={noteMap[noteId]}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        <>
          {sortedNoteIds.map((noteId) => (
            <NoteItem key={noteId} id={noteId} note={noteMap[noteId]} />
          ))}
        </>
      )}
      {isRootFolder && <FolderView folderId={undefined} />}
    </>
  );
}

function sortFolders(aArr: [string, INoteFolder], bArr: [string, INoteFolder]) {
  const a = aArr[1];
  const b = bArr[1];

  const t = i18n.t;
  const aName = getItemName({
    name: a.name,
    isRootPlayerFolder: a.isRootPlayerFolder,
    t,
  });
  const bName = getItemName({
    name: b.name,
    isRootPlayerFolder: b.isRootPlayerFolder,
    t,
  });
  return aName.localeCompare(bName);
}
