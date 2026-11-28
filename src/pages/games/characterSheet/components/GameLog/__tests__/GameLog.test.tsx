/**
 * The game's log: its rolls and messages, a composer for players but not
 * viewers, its empty and error states, and marking the log seen while it
 * is open.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "stores/auth.store";
import { GamePermission, useGameStore } from "stores/game.store";
import { useGameLogStore } from "stores/gameLog.store";

import { TestWrapper } from "tests/TestWrapper";

import { RollResult, RollType } from "repositories/shared.types";

import { IGameLog, LogType } from "services/gameLog.service";

import { GameLog } from "../GameLog";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/users.store", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useUserName: (uid: string) => (uid === "me" ? "Scott" : "Robin"),
}));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameId: () => "game",
  useGameIdOptional: () => "game",
}));
vi.mock("pages/games/characterSheet/hooks/useCharacterId", () => ({
  useCharacterIdOptional: () => undefined,
  useCharacterId: () => undefined,
}));

const createLog = vi.fn((id: string) => Promise.resolve(id));
const updateLastSeenLogDate = vi.fn(() => Promise.resolve());
const loadMoreLogsIfPresent = vi.fn();

const message: IGameLog = {
  id: "message",
  logType: LogType.MESSAGE,
  uid: "other",
  characterId: null,
  gameId: "game",
  guidesOnly: false,
  timestamp: new Date(2026, 10, 20, 20, 42),
  contents: "<p>Watch the door</p>",
};

const roll: IGameLog = {
  id: "roll",
  logType: LogType.ROLL,
  type: RollType.Stat,
  rollLabel: "Edge",
  uid: "me",
  characterId: null,
  gameId: "game",
  guidesOnly: false,
  timestamp: new Date(2026, 10, 20, 20, 45),
  statKey: "edge",
  action: 3,
  actionTotal: 5,
  challenge1: 4,
  challenge2: 7,
  modifier: 2,
  adds: 0,
  matchedNegativeMomentum: false,
  momentumBurned: null,
  result: RollResult.WeakHit,
} as IGameLog;

function seed(changes: Partial<ReturnType<typeof useGameLogStore.getState>>) {
  useGameLogStore.setState({
    logs: {},
    loading: false,
    error: undefined,
    hasHitEndOfList: true,
    createLog,
    updateLastSeenLogDate,
    loadMoreLogsIfPresent,
    ...changes,
  });
}

function renderLog(open = true) {
  return render(<GameLog open={open} />, { wrapper: TestWrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ uid: "me" });
  useGameStore.setState({ gamePermissions: GamePermission.Player });
  seed({});
});

describe("GameLog", () => {
  it("shows the game's rolls and messages", () => {
    seed({ logs: { message, roll } });
    renderLog();

    expect(screen.getByText("Watch the door")).toBeInTheDocument();
    expect(screen.getAllByText(/edge/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/robin/i).length).toBeGreaterThan(0);
  });

  it("gives players a composer", async () => {
    renderLog();
    expect(
      await screen.findByLabelText("Message to the game log"),
    ).toBeInTheDocument();
  });

  it("gives viewers no composer", () => {
    useGameStore.setState({ gamePermissions: GamePermission.Viewer });
    renderLog();

    expect(
      screen.queryByLabelText("Message to the game log"),
    ).not.toBeInTheDocument();
  });

  it("says when the log is empty", () => {
    renderLog();
    expect(screen.getByText(/no (logs|rolls or messages) yet/i)).toBeVisible();
  });

  it("says when the log couldn't load", () => {
    seed({ error: "Nope" });
    renderLog();
    expect(screen.getByText("Error loading logs")).toBeInTheDocument();
  });

  it("marks the log seen when it opens and when it closes", () => {
    const { rerender } = renderLog(false);
    expect(updateLastSeenLogDate).not.toHaveBeenCalled();

    rerender(<GameLog open />);
    expect(updateLastSeenLogDate).toHaveBeenCalledWith("game", "me");

    rerender(<GameLog open={false} />);
    expect(updateLastSeenLogDate).toHaveBeenCalledTimes(2);
  });
});
