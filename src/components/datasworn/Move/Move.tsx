import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";
import { EmptyState } from "@/components/layout/EmptyState";
import { useMove } from "@/hooks/datasworn/useMove";
import { Box, BoxProps, Heading } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { MoveOracles } from "./MoveOracles";
import { MoveRollOptions } from "./MoveRollOptions";

export interface MoveProps extends Omit<BoxProps, "children"> {
  moveId: string;
  hideMoveName?: boolean;
}

export function Move(props: MoveProps) {
  const { moveId, hideMoveName, ...boxProps } = props;
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
    <Box {...boxProps}>
      {!hideMoveName && <Heading size="lg">{move.name}</Heading>}
      <MoveRollOptions move={move} />
      <MarkdownRenderer markdown={move.text} />
      <MoveOracles move={move} />
    </Box>
  );
}
