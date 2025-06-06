import { Box, Button, Divider, Typography } from "@mui/material";

export function WorldSelectionPage() {
  return (
    <Box>
      <Typography>Choose an existing world</Typography>
      <Divider>Or</Divider>
      <Button>Create a New World</Button>
    </Box>
  );
}
