import { Box, Card, Typography } from "@mui/material";

interface NoteImageMainProps {
  url: string;
  label: string;
}

export function NoteImageMain(props: NoteImageMainProps) {
  const { url, label } = props;

  return (
    <>
      <Box
        flexGrow={1}
        position="relative"
        overflow="hidden"
        bgcolor="grey.950"
      >
        <Box
          component="img"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "top",
          }}
          src={url}
          // The label is shown as the page heading below, so the image
          // doesn't repeat it.
          alt=""
        />
        {label.trim() && (
          <Card
            sx={{
              px: 2,
              position: "absolute",
              bottom: 8,
              left: "50%",
              transform: "translate(-50%, 0)",
            }}
          >
            <Typography
              variant="h2"
              component="h1"
              fontFamily="fontFamilyTitle"
              whiteSpace={"nowrap"}
            >
              {label}
            </Typography>
          </Card>
        )}
      </Box>
    </>
  );
}
