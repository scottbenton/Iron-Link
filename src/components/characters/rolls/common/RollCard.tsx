import CloseIcon from "@mui/icons-material/Close";
import { Box, Button, Card, IconButton, SxProps, Theme } from "@mui/material";
import {
  PropsWithChildren,
  ReactNode,
  Ref,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import {
  TOUCH_DEVICE_MEDIA_QUERY,
  TOUCH_TARGET_SIZE,
} from "hooks/useIsTouchDevice";

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
  // Cuts a long card (a long oracle result) to a few lines, with a Show all
  // toggle, so the roll stack never grows off screen.
  clampContent?: boolean;
}

// How tall a clamped card's content may be: every dice roll fits, a long
// oracle result does not.
export const ROLL_CARD_CLAMPED_HEIGHT = "12rem";
// Fades the cut edge, so the card reads as continuing.
const CLAMP_FADE =
  "linear-gradient(to bottom, black calc(100% - 2rem), transparent)";

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
    clampContent,
  } = props;
  const { t } = useTranslation();

  const [isShowingAll, setIsShowingAll] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const clampRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const clamp = clampRef.current;
    // Measured while clamped; once shown in full the toggle stays to fold it.
    if (!clamp || clamp.dataset.clamped !== "true") return;
    setIsOverflowing(clamp.scrollHeight > clamp.clientHeight + 1);
  }, []);

  const isClamped = !!clampContent && !isShowingAll;

  useLayoutEffect(() => {
    if (!isClamped) {
      if (!clampContent) setIsOverflowing(false);
      return;
    }
    measure();
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [clampContent, isClamped, measure]);

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
        <Box
          ref={clampRef}
          data-clamped={isClamped ? "true" : "false"}
          px={2}
          py={1}
          position={"relative"}
          alignSelf={"stretch"}
          sx={
            isClamped
              ? {
                  maxHeight: ROLL_CARD_CLAMPED_HEIGHT,
                  overflow: "hidden",
                  ...(isOverflowing && {
                    maskImage: CLAMP_FADE,
                    WebkitMaskImage: CLAMP_FADE,
                  }),
                }
              : undefined
          }
        >
          {/* The dice, icons and numbers read poorly one by one, so screen
              readers get the summary in their place. */}
          <Box ref={contentRef} aria-hidden>
            {children}
          </Box>
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
      {clampContent && isOverflowing && (
        // Screen readers already get the whole roll from the summary; the
        // toggle only changes what is drawn.
        <Button
          size={"small"}
          color={"inherit"}
          aria-expanded={isShowingAll}
          onClick={() => setIsShowingAll((value) => !value)}
          sx={{
            ml: 1,
            mb: 0.5,
            [TOUCH_DEVICE_MEDIA_QUERY]: { minHeight: TOUCH_TARGET_SIZE },
          }}
        >
          {isShowingAll
            ? t("datasworn.roll-card.show-less", "Show less")
            : t("datasworn.roll-card.show-all", "Show all")}
        </Button>
      )}

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
