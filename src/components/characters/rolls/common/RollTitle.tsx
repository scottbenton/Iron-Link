import { Box, Typography } from "@mui/material";
import { useContext } from "react";

import { RollCardContext } from "./rollCardContext";

export interface RollTitleProps {
  overline?: string;
  title: string;
  isExpanded: boolean;
}

export function RollTitle(props: RollTitleProps) {
  const { isExpanded, title, overline } = props;
  const { hasDismissButton } = useContext(RollCardContext);

  // Room for the buttons in the card's top corner: the roll's actions while
  // it is expanded, and its dismiss button.
  const actionsWidth = (isExpanded ? 80 : 0) + (hasDismissButton ? 40 : 0);

  return (
    <Box
      display={"flex"}
      alignItems={"center"}
      justifyContent={"space-between"}
    >
      <div>
        {overline && isExpanded && (
          <Typography
            lineHeight={1.2}
            variant={"overline"}
            textTransform={"uppercase"}
            component={"p"}
            fontFamily={(theme) => theme.typography.fontFamilyTitle}
          >
            {overline}
          </Typography>
        )}
        <Typography
          textTransform={"uppercase"}
          variant={isExpanded ? "h6" : "subtitle1"}
          component={"p"}
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
          sx={{ mr: 1 }}
        >
          {title}
        </Typography>
      </div>
      {actionsWidth > 0 && (
        // Holds action space
        <Box height={40 - 16} width={actionsWidth - 16} flexShrink={0} />
      )}
    </Box>
  );
}
