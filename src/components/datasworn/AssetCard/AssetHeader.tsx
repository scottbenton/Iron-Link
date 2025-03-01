import { Tooltip } from "@/components/ui/tooltip";
import { getIsLocalEnvironment } from "@/lib/environment.lib";
import { Box, Card, Heading, Icon } from "@chakra-ui/react";
import { LinkIcon } from "lucide-react";

export interface AssetHeaderProps {
  category: string;
  id: string;
  actions?: React.ReactNode;
}

export function AssetHeader(props: AssetHeaderProps) {
  const { id, category, actions } = props;

  const isLocal = getIsLocalEnvironment();

  return (
    <Card.Header
      borderTopRadius={"inherit"}
      display={"flex"}
      flexDir={"row"}
      alignItems={"center"}
      justifyContent={"space-between"}
      pl={4}
      pr={2}
      bg="bg.inverted"
      color="fg.inverted"
      _dark={{
        bg: "bg.muted",
        color: "fg",
      }}
      py={1}
    >
      <Card.Title asChild>
        <Heading as="span" fontSize="sm">
          {category}
        </Heading>
      </Card.Title>
      <Box display={"flex"} alignItems={"center"}>
        {isLocal && (
          <Tooltip content={id}>
            <Icon color="inherit" size="sm">
              <LinkIcon />
            </Icon>
          </Tooltip>
        )}
        {actions}
      </Box>
    </Card.Header>
  );
}
