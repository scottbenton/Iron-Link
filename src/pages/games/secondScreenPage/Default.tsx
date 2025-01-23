import { Box, Typography } from "@mui/material";

import { IronLinkLogo } from "components/Layout/IronLinkLogo";

import { useGameStore } from "stores/game.store";

export function Default() {
  const gameName = useGameStore((store) => store.game?.name);

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      flexGrow={1}
    >
      <IronLinkLogo sx={{ width: 120, mt: -8 }} />
      <Typography variant="h1" component="h1" fontFamily="fontFamilyTitle">
        {gameName}
      </Typography>
    </Box>
  );
}
