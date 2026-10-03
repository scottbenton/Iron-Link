import DescriptionIcon from "@mui/icons-material/Description";
import { Box, Card, Typography } from "@mui/material";

import { IWorldEntry } from "services/worldEntries.service";

import { WorldCategoryIcon } from "./WorldCategoryIcon";

export function WorldCategoryEntryItem({ entry }: { entry: IWorldEntry }) {
  return (
    <Card component="li" variant="outlined" sx={{ mt: 1 }}>
      <Box
        sx={{ py: 1.5, px: 2, display: "flex", alignItems: "center", gap: 1 }}
      >
        {entry.icon?.key ? (
          <WorldCategoryIcon icon={entry.icon} size="small" />
        ) : (
          <DescriptionIcon sx={{ color: "primary.light" }} />
        )}
        <Typography sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
          {entry.name}
        </Typography>
      </Box>
    </Card>
  );
}
