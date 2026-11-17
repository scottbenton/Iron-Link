// Rolls, announcements, datasworn dialog, themes
import deepEqual from "fast-deep-equal";
import { useId, useLayoutEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { ColorScheme } from "repositories/shared.types";

import { IGameLogRoll } from "services/gameLog.service";

export type VisibleRoll = { id?: string; roll: IGameLogRoll };

// How many recent rolls are kept for the roll stack and its Recent rolls
// dialog; the oldest goes when another arrives.
export const MAX_RECENT_ROLLS = 10;

export enum ReferenceTabs {
  Moves = "moves",
  Oracles = "oracles",
  GameLog = "game-log",
  SecondScreen = "second-screen",
}

// The id of a Reference panel tab (wide screens only), so other places can
// move focus to it.
export function getReferenceTabId(tab: ReferenceTabs): string {
  return `tab-${tab}`;
}

interface AppStateState {
  announcement: string | null;
  // Goes up with every setAnnouncement call, so a message that repeats the last
  // one (the same oracle result twice) is still read out again.
  announcementId: number;
  dataswornDialogState: {
    isOpen: boolean;
    openId?: string;
    previousIds: string[];
  };

  visibleRolls: VisibleRoll[];
  // Places that can show the recent roll cards: the page, then each open
  // dialog. Only the last one shows them, since a modal dialog hides the
  // page from screen readers.
  rollCardHosts: string[];

  colorScheme: ColorScheme;

  currentReferenceTab: ReferenceTabs;
  // Whether the Reference panel is on screen: always beside the sheet on
  // wider screens, only while its bottom nav item is open on phones.
  isReferencePanelVisible: boolean;
  gameLogNotificationCount: number;
  // Whether the phone game layout's bottom nav is on screen (mounted and not
  // hidden for the keyboard), so the roll stack docks above it.
  isGameBottomNavVisible: boolean;
}

interface AppStateActions {
  setAnnouncement: (announcement: string) => void;

  openDataswornDialog: (id: string) => void;
  closeDataswornDialog: () => void;
  prevDataswornDialog: () => void;

  setColorScheme: (colorScheme: ColorScheme) => void;

  addRoll: (rollId: string | undefined, roll: IGameLogRoll) => void;
  updateRollIfPresent: (rollId: string, roll: IGameLogRoll) => void;
  clearRoll: (index: number) => void;
  clearAllRolls: () => void;
  addRollCardHost: (hostId: string, isPage?: boolean) => void;
  removeRollCardHost: (hostId: string) => void;
  setCurrentReferenceTab: (tab: ReferenceTabs) => void;
  setIsReferencePanelVisible: (visible: boolean) => void;
  setGameLogNotificationCount: (count: number) => void;
  resetReference: () => void;
  setIsGameBottomNavVisible: (visible: boolean) => void;
}

const defaultAppState: AppStateState = {
  announcement: null,
  announcementId: 0,
  dataswornDialogState: {
    isOpen: false,
    previousIds: [],
  },
  visibleRolls: [],
  rollCardHosts: [],
  colorScheme: getDefaultColorScheme(),
  currentReferenceTab: ReferenceTabs.Moves,
  isReferencePanelVisible: true,
  gameLogNotificationCount: 0,
  isGameBottomNavVisible: false,
};

// Whether the game log is on screen, so its new entries are already read.
export function isGameLogVisible(
  state: Pick<AppStateState, "currentReferenceTab" | "isReferencePanelVisible">,
): boolean {
  return (
    state.isReferencePanelVisible &&
    state.currentReferenceTab === ReferenceTabs.GameLog
  );
}

export const useAppState = createWithEqualityFn<
  AppStateState & AppStateActions
>()(
  immer((set) => ({
    ...defaultAppState,

    setAnnouncement: (announcement) =>
      set((state) => {
        state.announcement = announcement;
        state.announcementId += 1;
      }),

    openDataswornDialog: (id) => {
      set((state) => {
        if (state.dataswornDialogState.isOpen) {
          state.dataswornDialogState.previousIds.push(
            state.dataswornDialogState.openId!,
          );
        } else {
          state.dataswornDialogState.previousIds = [];
        }
        state.dataswornDialogState.isOpen = true;
        state.dataswornDialogState.openId = id;
      });
    },
    closeDataswornDialog: () => {
      set((state) => {
        state.dataswornDialogState.isOpen = false;
      });
    },
    prevDataswornDialog: () => {
      set((state) => {
        if (state.dataswornDialogState.previousIds.length > 0) {
          const newOpenId = state.dataswornDialogState.previousIds.pop();
          state.dataswornDialogState.openId = newOpenId;
        }
      });
    },
    setColorScheme: (colorScheme) => {
      set((state) => {
        state.colorScheme = colorScheme;
      });
    },
    addRoll: (rollId, roll) => {
      set((state) => {
        state.visibleRolls.push({ id: rollId, roll });
        if (state.visibleRolls.length > MAX_RECENT_ROLLS) {
          state.visibleRolls.splice(
            0,
            state.visibleRolls.length - MAX_RECENT_ROLLS,
          );
        }
      });
    },
    clearRoll: (index) => {
      set((state) => {
        state.visibleRolls.splice(index, 1);
      });
    },
    clearAllRolls: () => {
      set((state) => {
        state.visibleRolls = [];
      });
    },
    addRollCardHost: (hostId, isPage) => {
      set((state) => {
        // The page goes under any dialog, even one that mounted first.
        if (isPage) {
          state.rollCardHosts.unshift(hostId);
        } else {
          state.rollCardHosts.push(hostId);
        }
      });
    },
    removeRollCardHost: (hostId) => {
      set((state) => {
        state.rollCardHosts = state.rollCardHosts.filter((id) => id !== hostId);
      });
    },
    updateRollIfPresent: (rollId, roll) => {
      set((state) => {
        const rollIndex = state.visibleRolls.findIndex(
          ({ id }) => id === rollId,
        );
        if (rollIndex >= 0) {
          state.visibleRolls[rollIndex].roll = roll;
        }
      });
    },
    setCurrentReferenceTab: (tab) => {
      set((state) => {
        state.currentReferenceTab = tab;
        if (isGameLogVisible(state)) {
          state.gameLogNotificationCount = 0;
        }
      });
    },
    setIsReferencePanelVisible: (visible) => {
      set((state) => {
        state.isReferencePanelVisible = visible;
        if (isGameLogVisible(state)) {
          state.gameLogNotificationCount = 0;
        }
      });
    },
    setGameLogNotificationCount: (count) => {
      set((state) => {
        state.gameLogNotificationCount = isGameLogVisible(state) ? 0 : count;
      });
    },
    resetReference: () => {
      set((state) => {
        state.currentReferenceTab = defaultAppState.currentReferenceTab;
        state.gameLogNotificationCount =
          defaultAppState.gameLogNotificationCount;
      });
    },
    setIsGameBottomNavVisible: (visible) => {
      set((state) => {
        state.isGameBottomNavVisible = visible;
      });
    },
  })),
  deepEqual,
);

export function useAnnouncement() {
  return useAppState((state) => state.announcement);
}

export function useAnnouncementId() {
  return useAppState((state) => state.announcementId);
}

export function useSetAnnouncement() {
  return useAppState((state) => state.setAnnouncement);
}

export function useOpenDataswornDialog() {
  return useAppState((state) => state.openDataswornDialog);
}

export function useSetColorScheme() {
  return useAppState((state) => state.setColorScheme);
}

/**
 * Registers a place that can show the recent roll cards, and says whether it
 * is the one showing them: the most recently mounted, so an open dialog shows
 * them in place of the page behind it.
 */
export function useIsActiveRollCardHost(isPage = false): boolean {
  const hostId = useId();
  const addHost = useAppState((state) => state.addRollCardHost);
  const removeHost = useAppState((state) => state.removeRollCardHost);

  useLayoutEffect(() => {
    addHost(hostId, isPage);
    return () => removeHost(hostId);
  }, [hostId, isPage, addHost, removeHost]);

  return useAppState(
    (state) => state.rollCardHosts[state.rollCardHosts.length - 1] === hostId,
  );
}

export function useIsGameLogVisible() {
  return useAppState(isGameLogVisible);
}

export function useAddRollSnackbar() {
  return useAppState((state) => state.addRoll);
}

export function getDefaultColorScheme() {
  const isJune = new Date().getMonth() === 5;
  return isJune ? ColorScheme.PrideTraditional : ColorScheme.Default;
}
