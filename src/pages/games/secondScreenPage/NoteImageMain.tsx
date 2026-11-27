import { Card } from "ui/components/Card";
import { Text } from "ui/components/Text";
import { Box } from "ui/primitives";

interface NoteImageMainProps {
  url: string;
  label: string;
}

/** An image from a note, with its label as the screen's heading. */
export function NoteImageMain(props: NoteImageMainProps) {
  const { url, label } = props;

  return (
    <Box
      flex="1 1 auto"
      position="relative"
      overflow="hidden"
      css={{
        "& > img": {
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "top",
        },
      }}
    >
      <img
        src={url}
        // The label is shown as the page heading below, so the image
        // doesn't repeat it.
        alt=""
      />
      {label.trim() && (
        <Card
          padding="sm"
          raised
          css={{
            position: "absolute",
            bottom: "4",
            left: "50%",
            transform: "translateX(-50%)",
            paddingX: "4",
          }}
        >
          <Text variant="h1" css={{ whiteSpace: "nowrap" }}>
            {label}
          </Text>
        </Card>
      )}
    </Box>
  );
}
