import { AnimatePresence, Transition, motion } from "motion/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Card } from "ui/components/Card";
import { Progress } from "ui/components/Progress";
import { Flex } from "ui/primitives";

import { useDocumentTitle } from "hooks/useDocumentTitle";
import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useGameStore } from "stores/game.store";
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
import { WorldEntryMain } from "./WorldEntryMain";

const transition: Transition = {
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
  useSendPageViewEvent(PageCategory.GameSecondScreen);

  useSyncGame();
  useSyncColorScheme();
  useSyncSecondScreenSettings();

  const { t } = useTranslation();
  const gameName = useGameStore((state) => state.game?.name);
  useDocumentTitle(
    gameName
      ? t("game.document-title.second-screen", "Second Screen | {{gameName}}", {
          gameName,
        })
      : undefined,
  );

  const { settings, areAllCharactersVisible, loading } = useSecondScreenStore();

  // The display fills the window, so the page never scrolls behind it.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (loading) {
    return <Progress label={t("game.second-screen.loading", "Loading")} />;
  }

  return (
    <Flex
      height="100dvh"
      width="100vw"
      overflow="hidden"
      background="bg.canvas"
      padding="4"
      gap="4"
    >
      <AnimatePresence mode="popLayout" initial={true}>
        {areAllCharactersVisible && (
          <Card
            padding="none"
            css={{ flex: "none", width: "25%", overflow: "hidden" }}
            render={
              <motion.div
                layout
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={slideVariants}
                transition={transition}
              />
            }
          >
            <CharacterSidebar />
          </Card>
        )}
      </AnimatePresence>
      <Card
        padding="none"
        css={{ flex: "1 1 auto", display: "flex", overflow: "hidden" }}
        render={<motion.div layout transition={transition} />}
      >
        <AnimatePresence mode="popLayout" initial>
          <motion.div
            key={JSON.stringify(settings)}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeVariants}
            transition={transition}
            style={{ flexGrow: 1, display: "flex", minWidth: 0 }}
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
            {settings?.type === "world_entry" && (
              <WorldEntryMain
                worldId={settings.worldId}
                entryId={settings.entryId}
                map={settings.map}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Card>
    </Flex>
  );
}
