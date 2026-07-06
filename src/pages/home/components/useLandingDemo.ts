import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { createId } from "lib/id.lib";

import { RollResult } from "repositories/shared.types";

import { IStatRoll } from "services/gameLog.service";

import { DemoLogEntry, createDemoStatRoll } from "./landingDemo";

const MAX_LOG_ENTRIES = 4;
const INITIAL_TRACK_TICKS = 14;
const MAX_TRACK_TICKS = 40;
const DANGEROUS_PROGRESS_TICKS = 8;

const COMPANION_REACTION_DELAY_MS = 1600;
const COMPANION_PROGRESS_DELAY_MS = 3400;

export function useLandingDemo() {
  const { t } = useTranslation();

  const [logEntries, setLogEntries] = useState<DemoLogEntry[]>(() => [
    {
      id: createId(),
      authorName: t("home.demo.player-kira", "Kira"),
      isYou: false,
      timeText: t("home.demo.minutes-ago", "{{count}} min ago", { count: 2 }),
      content: {
        type: "roll",
        roll: createDemoStatRoll({
          rollLabel: t("home.demo.stat-wits", "Wits"),
          statKey: "wits",
          action: 4,
          modifier: 2,
          challenge1: 5,
          challenge2: 3,
        }),
      },
    },
    {
      id: createId(),
      authorName: t("home.demo.player-vesh", "Vesh"),
      isYou: false,
      timeText: t("home.demo.minutes-ago", "{{count}} min ago", { count: 1 }),
      content: {
        type: "message",
        text: t(
          "home.demo.vesh-camp-message",
          "We camp at the ridge. Kira, you have first watch.",
        ),
      },
    },
  ]);
  const [trackTicks, setTrackTicks] = useState(INITIAL_TRACK_TICKS);

  const timeoutIdsRef = useRef<number[]>([]);
  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  const addLogEntry = useCallback((entry: DemoLogEntry) => {
    setLogEntries((previousEntries) => [
      ...previousEntries.slice(-(MAX_LOG_ENTRIES - 1)),
      entry,
    ]);
  }, []);

  const handlePlayerRoll = useCallback(
    (roll: IStatRoll) => {
      addLogEntry({
        id: roll.id,
        authorName: t("home.demo.player-you", "Ivar (you)"),
        isYou: true,
        timeText: t("home.demo.just-now", "Just now"),
        content: { type: "roll", roll },
      });

      let kiraReaction = t(
        "home.demo.kira-weak-hit-reaction",
        "That works… but it'll cost us.",
      );
      if (roll.result === RollResult.StrongHit) {
        kiraReaction = t(
          "home.demo.kira-strong-hit-reaction",
          "Nice! That opens the pass for us.",
        );
      } else if (roll.result === RollResult.Miss) {
        kiraReaction = t(
          "home.demo.kira-miss-reaction",
          "Ouch. Time to pay the price…",
        );
      }

      timeoutIdsRef.current.push(
        window.setTimeout(() => {
          addLogEntry({
            id: createId(),
            authorName: t("home.demo.player-kira", "Kira"),
            isYou: false,
            timeText: t("home.demo.just-now", "Just now"),
            content: { type: "message", text: kiraReaction },
          });
        }, COMPANION_REACTION_DELAY_MS),
      );

      if (roll.result !== RollResult.Miss) {
        timeoutIdsRef.current.push(
          window.setTimeout(() => {
            setTrackTicks((previousTicks) =>
              Math.min(
                previousTicks + DANGEROUS_PROGRESS_TICKS,
                MAX_TRACK_TICKS,
              ),
            );
            addLogEntry({
              id: createId(),
              authorName: t("home.demo.player-vesh", "Vesh"),
              isYou: false,
              timeText: t("home.demo.just-now", "Just now"),
              content: {
                type: "message",
                text: t(
                  "home.demo.vesh-progress-message",
                  "Marking our progress on the journey.",
                ),
              },
            });
          }, COMPANION_PROGRESS_DELAY_MS),
        );
      }
    },
    [addLogEntry, t],
  );

  return {
    logEntries,
    trackTicks,
    setTrackTicks,
    handlePlayerRoll,
  };
}
