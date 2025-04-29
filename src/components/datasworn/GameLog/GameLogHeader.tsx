import { Box, Card, Text } from "@chakra-ui/react";
import { ReactNode } from "react";

export interface GameLogHeaderProps {
  title: string;
  overline?: string;
  actions?: ReactNode;
}

export function GameLogHeader(props: GameLogHeaderProps) {
  const { title, overline, actions } = props;

  return (
    <Card.Header>
      <Box display="flex" justifyContent="space-between" alignItems={"start"}>
        <Box>
          {overline && (
            <Text
              fontFamily={"heading"}
              color="fg.muted"
              fontSize="sm"
              textTransform={"uppercase"}
            >
              {overline}
            </Text>
          )}
          <Card.Title
            fontFamily={"heading"}
            fontSize="lg"
            textTransform={"uppercase"}
          >
            {title}
          </Card.Title>
        </Box>
        <Box display="flex" alignItems="center">
          {actions}
        </Box>
      </Box>
    </Card.Header>
  );
}
