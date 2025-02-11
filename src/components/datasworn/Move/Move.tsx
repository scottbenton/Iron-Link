import { Box, SxProps, Theme, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";
import { MarkdownRenderer } from "components/MarkdownRenderer";

import { useMove } from "hooks/datasworn/useMove";

import { MoveOracles } from "./MoveOracles";
import { MoveRollOptions } from "./MoveRollOptions";

export interface MoveProps {
  moveId: string;
  hideMoveName?: boolean;
  sx?: SxProps<Theme>;
}

export function Move(props: MoveProps) {
  const { moveId, hideMoveName, sx } = props;
  const move = useMove(moveId);

  const { t } = useTranslation();

  if (!move) {
    return (
      <EmptyState
        message={t(
          "datasworn.move-not-found",
          "Move with id {{moveId}} could not be found",
          { moveId },
        )}
      />
    );
  }

  return (
    <Box bgcolor="background.paper" sx={sx}>
      {!hideMoveName && <Typography variant={"h6"}>{move.name}</Typography>}
      <MoveRollOptions move={move} />
      <MarkdownRenderer markdown={move.text} />
      <MoveOracles move={move} />
    </Box>
  );
}
