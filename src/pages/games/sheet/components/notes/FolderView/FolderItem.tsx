import { FolderUserIcon } from "@/assets/FolderUser";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { ReadPermissions } from "@/repositories/shared.types";
import { INoteFolder } from "@/services/noteFolders.service";
import { Box, Card, Icon, Text } from "@chakra-ui/react";
import { FolderIcon } from "lucide-react";

import { getFolderName } from "./getFolderName";

export interface FolderItemProps {
  folderId: string;
  folder: INoteFolder;
}

export function FolderItem(props: FolderItemProps) {
  const { folderId, folder } = props;

  const t = useGameTranslations();

  return (
    <Card.Root
      variant="subtle"
      position="relative"
      size="sm"
      height="100%"
      _hover={{ bg: "bg.emphasized" }}
    >
      <Card.Body
        p={3}
        as="button"
        display="flex"
        flexDir="row"
        alignItems="center"
        justifyContent="flex-start"
        gap={2}
        cursor="pointer"
      >
        {folder.readPermissions !== ReadPermissions.OnlyAuthor ? (
          <FolderUserIcon color="fg.muted" size="md" />
        ) : (
          <Icon asChild color="fg.muted" size="md">
            <FolderIcon />
          </Icon>
        )}
        <Text flexGrow={1} textAlign={"left"}>
          {getFolderName({
            name: folder.name,
            isRootPlayerFolder: folder.isRootPlayerFolder,
            t,
          })}
        </Text>
        {/* <Box
          w={"40px"}
          ml={1}
          // sx={(theme) => ({
          //   width: `calc(${theme.spacing(1 - 2)} + 40px)`,
          //   ml: 1,
          // })}
        /> */}
      </Card.Body>
      {/* <FolderActionMenu folderId={folderId} /> */}
    </Card.Root>
  );
}
