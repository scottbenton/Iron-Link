import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import {
  WorldTruthChoice,
  WorldTruthsService,
} from "services/worldTruths.service";

// A world's truth choices, and for world editors and Guides the quest
// starters of the truths they wrote, as this window sees them. Every view of
// one world shares one listener.
interface WorldTruthsStoreState {
  // worldId -> truthId -> choice
  truths: Record<string, Record<string, WorldTruthChoice>>;
  // worldId -> truthId -> quest starter (Guide-only)
  questStarters: Record<string, Record<string, string>>;
  loading: Record<string, boolean>;
  errors: Record<string, string | undefined>;
}

interface WorldTruthsStoreActions {
  listenToWorldTruths: (worldId: string) => () => void;
  // Each shows at once, and goes back if the database refuses it.
  chooseOption: (
    worldId: string,
    truthId: string,
    optionId: string,
    subOptionId: string | null,
  ) => Promise<void>;
  setCustomTruth: (
    worldId: string,
    truthId: string,
    description: string,
    questStarter: string,
  ) => Promise<void>;
  clearTruth: (worldId: string, truthId: string) => Promise<void>;
}

export type WorldTruthsStore = WorldTruthsStoreState & WorldTruthsStoreActions;

const subscriptions: Record<string, { count: number; stop: () => void }> = {};

export const useWorldTruthsStore = createWithEqualityFn<WorldTruthsStore>()(
  immer((set, get) => {
    // Applies a change locally, runs the write, and restores this truth's
    // choice and quest starter if the write fails.
    const optimistic = async (
      worldId: string,
      truthId: string,
      choice: WorldTruthChoice | undefined,
      questStarter: string | undefined,
      write: () => Promise<void>,
    ) => {
      const before = get().truths[worldId]?.[truthId];
      const questBefore = get().questStarters[worldId]?.[truthId];
      const apply = (
        nextChoice: WorldTruthChoice | undefined,
        nextQuest: string | undefined,
      ) =>
        set((store) => {
          const truths = (store.truths[worldId] ??= {});
          const quests = (store.questStarters[worldId] ??= {});
          if (nextChoice) truths[truthId] = nextChoice;
          else delete truths[truthId];
          if (nextQuest) quests[truthId] = nextQuest;
          else delete quests[truthId];
        });
      apply(choice, questStarter);
      try {
        await write();
      } catch (error) {
        apply(before, questBefore);
        throw error;
      }
    };

    return {
      truths: {},
      questStarters: {},
      loading: {},
      errors: {},

      listenToWorldTruths: (worldId) => {
        const existing = subscriptions[worldId];
        if (existing) {
          existing.count++;
        } else {
          set((store) => {
            store.loading[worldId] = true;
          });
          const onError = (error: Error) =>
            set((store) => {
              store.loading[worldId] = false;
              store.errors[worldId] = error.message;
            });
          const stopTruths = WorldTruthsService.listenToWorldTruths(
            worldId,
            (changed, removed, replace) =>
              set((store) => {
                store.loading[worldId] = false;
                store.errors[worldId] = undefined;
                if (replace || !store.truths[worldId])
                  store.truths[worldId] = {};
                const truths = store.truths[worldId];
                removed.forEach((truthId) => delete truths[truthId]);
                changed.forEach((choice) => {
                  truths[choice.truthId] = choice;
                });
              }),
            onError,
          );
          const stopQuests = WorldTruthsService.listenToWorldTruthQuestStarters(
            worldId,
            (changed, removed, replace) =>
              set((store) => {
                if (replace || !store.questStarters[worldId])
                  store.questStarters[worldId] = {};
                const quests = store.questStarters[worldId];
                removed.forEach((truthId) => delete quests[truthId]);
                Object.assign(quests, changed);
              }),
            onError,
          );
          subscriptions[worldId] = {
            count: 1,
            stop: () => {
              stopTruths();
              stopQuests();
            },
          };
        }
        return () => {
          const subscription = subscriptions[worldId];
          if (!subscription) return;
          subscription.count--;
          if (subscription.count > 0) return;
          delete subscriptions[worldId];
          subscription.stop();
          set((store) => {
            delete store.truths[worldId];
            delete store.questStarters[worldId];
            delete store.loading[worldId];
            delete store.errors[worldId];
          });
        };
      },

      chooseOption: (worldId, truthId, optionId, subOptionId) =>
        optimistic(
          worldId,
          truthId,
          { truthId, optionId, subOptionId, customDescription: null },
          undefined,
          () =>
            WorldTruthsService.chooseOption(
              worldId,
              truthId,
              optionId,
              subOptionId,
            ),
        ),

      setCustomTruth: (worldId, truthId, description, questStarter) =>
        optimistic(
          worldId,
          truthId,
          {
            truthId,
            optionId: null,
            subOptionId: null,
            customDescription: description,
          },
          questStarter,
          () =>
            WorldTruthsService.setCustomTruth(
              worldId,
              truthId,
              description,
              questStarter,
            ),
        ),

      clearTruth: (worldId, truthId) =>
        optimistic(worldId, truthId, undefined, undefined, () =>
          WorldTruthsService.clearTruth(worldId, truthId),
        ),
    };
  }),
);

export function useListenToWorldTruths(worldId: string | undefined) {
  const listen = useWorldTruthsStore((store) => store.listenToWorldTruths);
  useEffect(() => (worldId ? listen(worldId) : undefined), [worldId, listen]);
}

const noTruths: Record<string, WorldTruthChoice> = {};
const noQuestStarters: Record<string, string> = {};

export function useWorldTruthChoices(
  worldId: string | undefined,
): Record<string, WorldTruthChoice> {
  return useWorldTruthsStore((store) =>
    worldId ? (store.truths[worldId] ?? noTruths) : noTruths,
  );
}

export function useWorldTruthQuestStarters(
  worldId: string | undefined,
): Record<string, string> {
  return useWorldTruthsStore((store) =>
    worldId
      ? (store.questStarters[worldId] ?? noQuestStarters)
      : noQuestStarters,
  );
}
