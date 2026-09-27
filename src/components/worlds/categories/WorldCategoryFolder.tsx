import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import { Card, CardActionArea, Typography } from "@mui/material";

import { IWorldCategory } from "services/worldCategories.service";

import { WorldCategoryIcon } from "./WorldCategoryIcon";

export function WorldCategoryFolder({
  category,
  onOpen,
}: {
  category: IWorldCategory;
  onOpen: () => void;
}) {
  return (
    <Card
      variant="outlined"
      sx={{ bgcolor: "background.default", height: "100%" }}
    >
      <CardActionArea
        onClick={onOpen}
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
          <WorldCategoryIcon icon={category.icon} />
        ) : (
          <FolderOutlinedIcon color="action" />
        )}
        <Typography sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
          {category.name}
        </Typography>
      </CardActionArea>
    </Card>
  );
}
