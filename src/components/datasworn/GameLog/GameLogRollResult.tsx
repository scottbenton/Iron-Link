import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";
import { Box, Text } from "@chakra-ui/react";

export interface GameLogRollResultProps {
  result?: string;
  markdown?: string;
  secondaryMarkdown?: string;
  extras?: string[];
}

export function GameLogRollResult(props: GameLogRollResultProps) {
  const { result, markdown, secondaryMarkdown, extras } = props;

  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      alignItems={"flex-start"}
      justifyContent={"center"}
    >
      {result && (
        <Text
          color={"fg"}
          fontFamily={"heading"}
          fontSize="xl"
          textTransform={"uppercase"}
        >
          {result}
        </Text>
      )}
      {markdown && (
        <Box maxWidth={"30ch"}>
          <MarkdownRenderer markdown={markdown} inheritColor disableLinks />
        </Box>
      )}
      {secondaryMarkdown && (
        <Box maxWidth={"30ch"}>
          <MarkdownRenderer
            markdown={secondaryMarkdown}
            inheritColor
            disableLinks
            inlineParagraph
          />
        </Box>
      )}
      {Array.isArray(extras) &&
        extras.map((extra) => (
          <Text key={extra} color="fg.muted" fontFamily={"heading"}>
            {extra}
          </Text>
        ))}
    </Box>
  );
}
