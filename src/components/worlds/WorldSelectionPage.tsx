import { Box, Button, Divider, Typography } from "@mui/material";

export function WorldSelectionPage() {
  return (
    <Box mt={4}>
      <Typography>Choose an existing world</Typography>
      <Divider sx={{ my: 2 }}>Or</Divider>

      <Button>Create a New World</Button>
    </Box>
  );
}
