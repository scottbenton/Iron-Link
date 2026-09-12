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

import { useUID } from "stores/auth.store";
import { getPlayerNotesFolder, useNotesStore } from "stores/notes.store";

import { i18n } from "i18n/config";

import { INoteFolder } from "services/noteFolders.service";
import { INote } from "services/notes.service";

import { useShowWorldItem } from "../hooks/useGameWorld";
import { FolderItem } from "./FolderItem";
import { NoteItem } from "./NoteItem";
import { SortableNoteItem } from "./SortableNoteItem";
import { WorldItem } from "./WorldItem";
import { getItemName } from "./getFolderName";
import { useFolderPermission } from "./useFolderPermissions";

// The folder grid holds folder cards plus, in the viewer's own root folder,
// the game's world as the leading tile.
type FolderGridItem =
  | { kind: "world" }
  | { kind: "folder"; folderId: string; folder: INoteFolder };

export interface FolderViewProps {
  folderId: string | undefined;
}
export function FolderView(props: FolderViewProps) {
  const { folderId } = props;

  const { t } = useTranslation();

  const { canEdit } = useFolderPermission(folderId);

  // The world tile belongs to the game, so it shows once: in the viewer's own
  // root folder, which is the folder view they actually land on.
  const uid = useUID();
  const rootPlayerFolderId = useNotesStore((state) =>
    uid ? getPlayerNotesFolder(uid, state.folderState.folders)?.id : undefined,
  );
  const showWorldItem =
    useShowWorldItem() &&
    folderId !== undefined &&
    folderId === rootPlayerFolderId;

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
    return Object.entries(state.folderState.folders)
      .filter(([, folder]) => folder.parentFolderId === folderId)
      .sort(sortFolders);
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

  const gridItems: FolderGridItem[] = [
    ...(showWorldItem ? [{ kind: "world" as const }] : []),
    ...subFolders.map(([subFolderId, subFolder]) => ({
      kind: "folder" as const,
      folderId: subFolderId,
      folder: subFolder,
    })),
  ];

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
      {gridItems.length > 0 && (
        <GridLayout
          sx={{ mb: 1 }}
          gap={1}
          items={gridItems}
          minWidth={200}
          renderItem={(item) =>
            item.kind === "world" ? (
              <WorldItem key="world" />
            ) : (
              <FolderItem
                key={item.folderId}
                folderId={item.folderId}
                folder={item.folder}
              />
            )
          }
        />
      )}
      {subFolders.length === 0 &&
        sortedNoteIds.length === 0 &&
        folderId &&
        !showWorldItem && (
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
