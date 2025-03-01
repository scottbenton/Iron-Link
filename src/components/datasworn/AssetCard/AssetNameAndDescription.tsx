import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";
import { Tooltip } from "@/components/ui/tooltip";
import { Box, Heading, Icon } from "@chakra-ui/react";
import { GroupIcon } from "lucide-react";

export interface AssetNameAndDescriptionProps {
  name: string;
  description?: string;
  shared?: boolean;
  showSharedIcon?: boolean;
}

export function AssetNameAndDescription(props: AssetNameAndDescriptionProps) {
  const { name, description, shared, showSharedIcon } = props;

  return (
    <>
      <Box
        display={"flex"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Heading as={"h3"} fontSize="2xl">
          {name}
        </Heading>
        {shared && showSharedIcon && (
          <Tooltip content={"Shared"}>
            <Icon colorPalette="colorScheme">
              <GroupIcon />
            </Icon>
          </Tooltip>
        )}
      </Box>
      {description && (
        <Box color="fg.muted">
          <MarkdownRenderer inheritColor markdown={description} />
        </Box>
      )}
    </>
  );
}
