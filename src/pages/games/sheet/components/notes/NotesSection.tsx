import { ProgressBar } from "@/components/common/ProgressBar";
import { useNotesStore } from "@/stores/notes.store";
import { IconButton, Tabs } from "@chakra-ui/react";
import { PlusIcon } from "lucide-react";

import { DefaultNoteChooser } from "./DefaultNoteChooser";
import { FolderView } from "./FolderView";
import { NoteView } from "./NoteView";
import { TabItem } from "./common/TabItem";

export function NotesSection() {
  const areNotesLoading = useNotesStore(
    (store) => store.folderState.loading || store.noteState.loading,
  );

  const openItems = useNotesStore((store) => store.openItems);
  const openNewTab = useNotesStore((store) => store.addOpenItem);
  const currentOpenItem = useNotesStore((store) => store.currentOpenItem);
  const setCurrentOpenItem = useNotesStore((store) => store.setCurrentOpenItem);
  const defaultNewTab = useNotesStore((store) => {
    return Object.values(store.folderState.folders).find(
      (folder) => folder.isRootPlayerFolder,
    )?.id;
  });

  if (areNotesLoading) {
    return <ProgressBar value={null} mx={-6} mt={-6} borderRadius="none" />;
  }

  return (
    <>
      <DefaultNoteChooser />
      <Tabs.Root
        value={
          currentOpenItem
            ? `${currentOpenItem.tabId}.${currentOpenItem.type}.${currentOpenItem.id}`
            : undefined
        }
        variant="line"
        size="sm"
        onValueChange={(details) => {
          const [tabId, type, id] = details.value.split(".");
          setCurrentOpenItem({
            type: type === "folder" ? "folder" : "note",
            id,
            tabId,
          });
        }}
      >
        <Tabs.List
          w="100%"
          bg="bg.subtle"
          borderRadius={"none"}
          pl={4}
          pr={0}
          _before={{ display: "none" }}
          overflowX="auto"
        >
          {openItems.map((item, index) => (
            <TabItem key={item.tabId} openItem={item} index={index} />
          ))}
          {defaultNewTab && (
            <IconButton
              size="sm"
              borderRadius={"none"}
              variant="ghost"
              aria-label="Add Tab"
              alignSelf="center"
              ml="auto"
              bg="bg"
              colorPalette={"gray"}
              onClick={() => {
                openNewTab("folder", defaultNewTab, undefined, false, true);
              }}
            >
              <PlusIcon />
            </IconButton>
          )}
        </Tabs.List>
        <Tabs.ContentGroup px={4} py={4}>
          {openItems.map((item) => (
            <Tabs.Content
              key={item.tabId}
              value={`${item.tabId}.${item.type}.${item.id}`}
              padding={0}
            >
              {item.type === "folder" ? (
                <FolderView folderId={item.id} />
              ) : (
                <NoteView />
              )}
            </Tabs.Content>
          ))}
        </Tabs.ContentGroup>
      </Tabs.Root>
    </>
  );
}
