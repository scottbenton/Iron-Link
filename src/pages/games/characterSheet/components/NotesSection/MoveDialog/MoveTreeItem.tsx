import { TreeItem } from "@mui/x-tree-view";

import { useItemName } from "stores/notes.store";

import { INoteFolder } from "services/noteFolders.service";

export interface MoveTreeItemProps {
  folderId: string;
  folders: Record<string, INoteFolder>;
  tree: Record<string, string[]>;
  currentFolderId: string | undefined;
}
export function MoveTreeItem(props: MoveTreeItemProps) {
  const { folderId, folders, tree, currentFolderId } = props;

  const folderName = useItemName("folder", folderId);
  const children = tree[folderId] ?? [];

  return (
    <TreeItem
      itemId={folderId}
      label={folderName}
      disabled={folderId === currentFolderId}
    >
      {children.map((childId) => (
        <MoveTreeItem
          key={childId}
          folderId={childId}
          folders={folders}
          tree={tree}
          currentFolderId={currentFolderId}
        />
      ))}
    </TreeItem>
  );
}
