import GroupIcon from "@mui/icons-material/Group";
import { Box, Tooltip, Typography } from "@mui/material";

import { MarkdownRenderer } from "components/MarkdownRenderer";

export interface AssetNameAndDescriptionProps {
  name: string;
  description?: string;
  shared?: boolean;
  showSharedIcon?: boolean;
}

export function AssetNameAndDescription(props: AssetNameAndDescriptionProps) {
  const { name, description, shared, showSharedIcon } = props;

  return (
    <>
      <Box
        display={"flex"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Typography
          variant={"h5"}
          component={"h3"}
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
        >
          {name}
        </Typography>
        {shared && showSharedIcon && (
          <Tooltip title={"Shared"}>
            <GroupIcon color={"primary"} />
          </Tooltip>
        )}
      </Box>
      {description && (
        <Box color={(theme) => theme.palette.text.secondary}>
          <MarkdownRenderer inheritColor markdown={description} />
        </Box>
      )}
    </>
  );
}
