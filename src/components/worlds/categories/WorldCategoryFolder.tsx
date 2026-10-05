import FolderIcon from "@mui/icons-material/Folder";
import { Card, CardActionArea, Typography } from "@mui/material";

import { LinkComponent } from "components/LinkComponent";

import { IWorldCategory } from "services/worldCategories.service";

import type { WorldLinkProps } from "../worldNavigation";
import { WorldCategoryIcon } from "./WorldCategoryIcon";

// Matches the Notes FolderItem card so categories read as folders.
export function WorldCategoryFolder({
  category,
  linkProps,
}: {
  category: IWorldCategory;
  linkProps: WorldLinkProps;
}) {
  return (
    <Card
      variant="outlined"
      sx={{ bgcolor: "background.default", height: "100%" }}
    >
      <CardActionArea
        LinkComponent={LinkComponent}
        {...linkProps}
        sx={{
          py: 1.5,
          px: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 1,
          height: "100%",
        }}
      >
        {category.icon?.key ? (
          <WorldCategoryIcon icon={category.icon} size="small" />
        ) : (
          <FolderIcon color="action" />
        )}
        <Typography sx={{ flexGrow: 1, minWidth: 0, overflowWrap: "anywhere" }}>
          {category.name}
        </Typography>
      </CardActionArea>
    </Card>
  );
}
