import CloseIcon from "@mui/icons-material/Close";
import { Box, Card, IconButton, SxProps, Theme } from "@mui/material";
import { PropsWithChildren, ReactNode, Ref } from "react";

import { RollCardContext } from "./rollCardContext";

export interface RollCardProps {
  sx?: SxProps<Theme>;
  // Everything the card shows, as one piece of text for screen readers.
  summary: string;
  isExpanded?: boolean;
  actions?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  dismissButtonRef?: Ref<HTMLButtonElement>;
}

export function RollCard(props: PropsWithChildren<RollCardProps>) {
  const {
    sx,
    children,
    summary,
    isExpanded,
    actions,
    onDismiss,
    dismissLabel,
    dismissButtonRef,
  } = props;

  return (
    <Card
      sx={[
        {
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          position: "relative",
          bgcolor: "grey.800",
          color: "common.white",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <RollCardContext.Provider value={{ hasDismissButton: !!onDismiss }}>
        <Box px={2} py={1} position={"relative"}>
          {/* The dice, icons and numbers read poorly one by one, so screen
              readers get the summary in their place. */}
          <Box aria-hidden>{children}</Box>
          {/* The summary covers the card, so touching anywhere on it reads
              it, with VoiceOver's touch exploration too. */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              color: "transparent",
              forcedColorAdjust: "none",
              fontSize: "1px",
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            {summary}
          </Box>
        </Box>
      </RollCardContext.Provider>

      <Box position={"absolute"} top={0} right={0} zIndex={1} display={"flex"}>
        {isExpanded && actions}
        {onDismiss && (
          <IconButton
            ref={dismissButtonRef}
            aria-label={dismissLabel}
            color={"inherit"}
            onClick={onDismiss}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>
    </Card>
  );
}
