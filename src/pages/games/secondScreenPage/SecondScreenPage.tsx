import { Box, Card, GlobalStyles, LinearProgress } from "@mui/material";
import { AnimatePresence, motion } from "motion/react";

import {
  useSecondScreenStore,
  useSyncSecondScreenSettings,
} from "stores/secondScreen.store";

import { useSyncGame } from "../gamePageLayout/hooks/useSyncGame";
import { useSyncColorScheme } from "../hooks/useSyncColorScheme";
import { CharacterMain } from "./CharacterMain";
import { CharacterSidebar } from "./CharacterSidebar";
import { Default } from "./Default";
import { NoteImageMain } from "./NoteImageMain";
import { TrackScreenMain } from "./TrackScreenMain";

const transition = {
  duration: 0.5,
  ease: [0.42, 0, 0.58, 1], // Custom cubic-bezier easing
};

const slideVariants = {
  hidden: {
    x: "-100%",
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
  },
  exit: {
    x: "-100%",
    opacity: 0,
  },
};

const fadeVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

export default function SecondScreenPage() {
  useSyncGame();
  useSyncColorScheme();
  useSyncSecondScreenSettings();

  const { settings, areAllCharactersVisible, loading } = useSecondScreenStore();

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box
      height={"100vh"}
      width="100vw"
      overflow={"hidden"}
      display={"flex"}
      flexDirection={"row"}
      bgcolor="grey.950"
      p={2}
      gap={2}
      sx={{
        "html body": {
          maxHeight: "100vh",
          maxWidth: "100vw",
          overflow: "hidden",
        },
      }}
    >
      <GlobalStyles styles={{ body: { overflow: "hidden" } }} />
      {loading ? (
        <LinearProgress sx={{ flexGrow: 1 }} />
      ) : (
        <>
          <AnimatePresence mode="popLayout" initial={true}>
            {areAllCharactersVisible && (
              <Card
                layout
                component={motion.div}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={slideVariants}
                sx={{ flexShrink: 0, maxWidth: "25%", width: "25%" }}
                transition={transition}
              >
                <CharacterSidebar />
              </Card>
            )}
          </AnimatePresence>
          <Card
            component={motion.div}
            layout
            sx={{ flexGrow: 1, display: "flex", overflow: "hidden" }}
            transition={transition}
          >
            <AnimatePresence mode="popLayout" initial>
              <Box
                component={motion.div}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={fadeVariants}
                transition={transition}
                sx={{ flexGrow: 1, display: "flex" }}
                key={JSON.stringify(settings)}
              >
                {!settings && <Default />}
                {settings?.type === "character" && (
                  <CharacterMain characterId={settings.characterId} />
                )}
                {settings?.type === "note_image" && (
                  <NoteImageMain url={settings.url} label={settings.label} />
                )}
                {settings?.type === "track" && (
                  <TrackScreenMain trackId={settings.trackId} />
                )}
              </Box>
            </AnimatePresence>
          </Card>
        </>
      )}
    </Box>
  );
}
