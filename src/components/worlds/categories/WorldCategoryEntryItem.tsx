import { Box, Card, CardActionArea, Typography } from "@mui/material";

import { LinkComponent } from "components/LinkComponent";

import { IWorldEntry } from "services/worldEntries.service";

import { WorldEntryIcon } from "../entries/WorldEntryIcon";
import type { WorldLinkProps } from "../worldNavigation";

export function WorldCategoryEntryItem({
  entry,
  subtitle,
  linkProps,
}: {
  entry: IWorldEntry;
  subtitle?: string;
  linkProps: WorldLinkProps;
}) {
  return (
    <Card component="li" variant="outlined" sx={{ mt: 1 }}>
      <CardActionArea
        LinkComponent={LinkComponent}
        {...linkProps}
        sx={{ py: 1.5, px: 2, display: "flex", alignItems: "center", gap: 1 }}
      >
        <WorldEntryIcon entry={entry} size="small" />
        <Box component="span" sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ overflowWrap: "anywhere" }}>
            {entry.name}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ overflowWrap: "anywhere" }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
}
