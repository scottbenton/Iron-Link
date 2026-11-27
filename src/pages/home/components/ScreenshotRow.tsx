import { Text } from "ui/components/Text";
import { Box, Flex } from "ui/primitives";

export interface ScreenshotRowProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  /** Puts the picture before the text on wide screens. */
  imageFirst?: boolean;
}

/**
 * A screenshot beside its text, the picture taking the wider share. When the
 * two no longer fit side by side the picture wraps under the text, whichever
 * side it sits on when wide.
 */
export function ScreenshotRow(props: ScreenshotRowProps) {
  const { title, description, imageSrc, imageAlt, imageFirst } = props;

  return (
    <Flex
      flexWrap="wrap"
      alignItems="center"
      gap="6"
      flexDirection={imageFirst ? "row-reverse" : "row"}
    >
      <Box flex="2 1 280px" minWidth="0">
        <Text variant="h2">{title}</Text>
        <Text color="muted" css={{ marginBlockStart: "2" }}>
          {description}
        </Text>
      </Box>
      <Box
        flex="3 1 420px"
        minWidth="0"
        overflow="hidden"
        borderRadius="md"
        border="1px solid"
        borderColor="border.default"
        css={{
          "& img": {
            display: "block",
            width: "100%",
            height: "auto",
            aspectRatio: "16 / 10",
          },
        }}
      >
        <img src={imageSrc} alt={imageAlt} />
      </Box>
    </Flex>
  );
}
