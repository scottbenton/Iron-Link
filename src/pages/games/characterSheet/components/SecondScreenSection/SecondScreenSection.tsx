import ExpandIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Typography,
} from "@mui/material";
import { useCallback, useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { CopyButton } from "components/CopyButton";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import { useSecondScreenStore } from "stores/secondScreen.store";

interface SecondScreenSectionSettingsProps {
  open: boolean;
}

export function SecondScreenSectionSettings(
  props: SecondScreenSectionSettingsProps,
) {
  const { open } = props;
  const { t } = useTranslation();

  const gameId = useGameId();
  const link = `${window.location.origin}/games/${gameId}/display`;

  const iframeWindow = useRef<HTMLIFrameElement | null>(null);
  const container = useRef<HTMLDivElement | null>(null);

  const areAllCharactersVisible = useSecondScreenStore(
    (store) => store.areAllCharactersVisible,
  );
  const setAreAllCharactersVisible = useSecondScreenStore(
    (store) => store.setAreAllCharactersVisible,
  );

  const updateAreAllCharactersVisible = useCallback(() => {
    if (gameId) {
      setAreAllCharactersVisible(gameId, !areAllCharactersVisible);
    }
  }, [gameId, areAllCharactersVisible, setAreAllCharactersVisible]);

  useLayoutEffect(() => {
    function scaleIFrame() {
      if (!container.current || !iframeWindow.current) {
        console.error("Container or iframeWindow is not defined");
        return;
      }
      // 1. Get the current width of the *container* (the target size)
      const containerWidth = container.current?.offsetWidth;

      // 2. Get the original width of the *iframe* (the fixed source size)
      const iframeOriginalWidth = 1920; // Must match the CSS #dynamicIframe width

      // 3. Calculate the scale factor
      const scaleFactor = containerWidth / iframeOriginalWidth;

      // 4. Apply the scale transform
      iframeWindow.current.style.transform = `scale(${scaleFactor})`;

      // 5. Adjust the container height to match the scaled height
      const iframeOriginalHeight = 1080; // Must match the CSS #dynamicIframe height
      container.current.style.height = `${iframeOriginalHeight * scaleFactor}px`;
    }

    window.addEventListener("resize", scaleIFrame);
    if (open) {
      scaleIFrame();
    }
    return () => {
      window.removeEventListener("resize", scaleIFrame);
    };
  }, [open]);

  return (
    <Box
      p={2}
      display="flex"
      flexDirection="column"
      gap={2}
      alignItems={"flex-start"}
    >
      <Typography variant="h6">
        {t("game.second-screen.title", "Second Screen")}
      </Typography>
      <CopyButton
        link={link}
        dialogTitle={t(
          "game.second-screen.copy-button",
          "Copy Second Screen Link",
        )}
        variant="outlined"
        color="inherit"
      >
        {t("game.second-screen.copy-button", "Copy Second Screen Link")}
      </CopyButton>
      <Button
        variant="outlined"
        color="inherit"
        onClick={updateAreAllCharactersVisible}
      >
        {areAllCharactersVisible
          ? t(
              "game.second-screen.hide-all-characters",
              "Hide Character Sidebar",
            )
          : t(
              "game.second-screen.show-all-characters",
              "Show Character Sidebar",
            )}
      </Button>
      <Box alignSelf="stretch">
        <Typography variant="overline">
          {t("game.second-screen.current-state", "Current View")}
        </Typography>
        <Box ref={container} mx={-2} overflow="hidden">
          <Box
            component="iframe"
            ref={iframeWindow}
            src={link}
            width={1920}
            height={1080}
            border="none"
            sx={{
              transformOrigin: "0 0",
              transform: "scale(1)",
            }}
          />
        </Box>
      </Box>
      <div>
        <Accordion variant="outlined">
          <AccordionSummary
            aria-controls="panel1-content"
            aria-label="panel1-header"
            expandIcon={<ExpandIcon />}
          >
            <Typography component="span">
              {t(
                "game.second-screen.explainer",
                "How to use the second screen",
              )}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              {t(
                "game.second-screen.explainer.content",
                "The second screen can be used to display information to players. I have used it on the back of my DM screen to share information and art with my players.",
              )}
            </Typography>
            <Typography>
              {t(
                "game.second-screen.explainer.content-2",
                "You can use it to display the following information:",
              )}
              <ul>
                <li>
                  {t(
                    "game.second-screen.explainer.content-2.item-1",
                    "All character statuses (toggleable in the sidebar above)",
                  )}
                </li>
                <li>
                  {t(
                    "game.second-screen.explainer.content-2.item-2",
                    'Character artwork (toggleable from the "Game Overview" > "Characters" tab)',
                  )}
                </li>
                <li>
                  {t(
                    "game.second-screen.explainer.content-2.item-3",
                    'Current status of a progress track (toggleable from the "tracks" tab)',
                  )}
                </li>
                <li>
                  {t(
                    "game.second-screen.explainer.content-2.item-4",
                    'Images from your notes (toggleable by clicking on the image and selecting the "Open on Second Screen" button). The alt text of the image will be used as the title.',
                  )}
                </li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>
      </div>
    </Box>
  );
}
