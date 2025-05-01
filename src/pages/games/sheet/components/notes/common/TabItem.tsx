import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { OpenItem, useNotesStore } from "@/stores/notes.store";
import { IconButton, Tabs } from "@chakra-ui/react";
import { XIcon } from "lucide-react";

import { getFolderName } from "../FolderView/getFolderName";

export interface TabItemProps {
  openItem: OpenItem;
  index: number;
}

export function TabItem(props: TabItemProps) {
  const { openItem, index } = props;

  const t = useGameTranslations();

  const itemName = useNotesStore((store) => {
    if (openItem.type === "folder") {
      return getFolderName({
        name: store.folderState.folders[openItem.id]?.name,
        isRootPlayerFolder:
          store.folderState.folders[openItem.id]?.isRootPlayerFolder ?? false,
        t,
      });
    } else {
      return store.noteState.notes[openItem.id]?.title;
    }
  });

  const closeItem = useNotesStore((store) => store.closeOpenItem);

  return (
    <Tabs.Trigger
      value={`${openItem.tabId}.${openItem.type}.${openItem.id}`}
      key={openItem.id}
      bg="bg"
      flexShrink={0}
    >
      {itemName}
      <IconButton
        colorPalette={"gray"}
        as="span"
        role="button"
        size="2xs"
        variant="ghost"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          closeItem(index);
        }}
      >
        <XIcon />
      </IconButton>
    </Tabs.Trigger>
  );
}
