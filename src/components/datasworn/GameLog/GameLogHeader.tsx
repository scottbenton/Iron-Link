import { Card, Text } from "@chakra-ui/react";

export interface GameLogHeaderProps {
  title: string;
  overline?: string;
}

export function GameLogHeader(props: GameLogHeaderProps) {
  const { title, overline } = props;

  return (
    <Card.Header>
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
    </Card.Header>
  );
}
