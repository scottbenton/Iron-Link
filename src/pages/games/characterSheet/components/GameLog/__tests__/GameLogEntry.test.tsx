/**
 * Who a game log entry is from and what a screen reader hears first, app
 * and library side by side (migration slice 4).
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GameLog as LibraryGameLog } from "ui/game/GameLog";

import { useUID } from "stores/auth.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useUserName } from "stores/users.store";

import { TestWrapper } from "tests/TestWrapper";

import { RollResult, RollType } from "repositories/shared.types";

import { IGameLog, LogType } from "services/gameLog.service";

import { GameLogEntry } from "../GameLogEntry";

vi.mock("stores/auth.store", () => ({ useUID: vi.fn() }));
vi.mock("stores/users.store", () => ({ useUserName: vi.fn() }));
vi.mock("components/characters/rolls/RollSnackbar", () => ({
  RollSnackbar: (props: { summaryPrefix?: string }) => (
    <p data-testid="roll-prefix">{props.summaryPrefix}</p>
  ),
}));
vi.mock("../NormalRollActions", () => ({ NormalRollActions: () => null }));
vi.mock("../GameLogMessage", () => ({ GameLogMessage: () => null }));

const userNames: Record<string, string> = { scott: "Scott", kira: "Kira" };

const timestamp = new Date(2026, 10, 20, 20, 42);
const time = timestamp.toLocaleString(undefined, {
  weekday: "long",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const base = {
  id: "log",
  timestamp,
  gameId: "game",
  guidesOnly: false,
};

function message(uid: string, characterId: string | null): IGameLog {
  return {
    ...base,
    logType: LogType.MESSAGE,
    uid,
    characterId,
    contents: "Hello",
  };
}

function roll(uid: string, characterId: string | null): IGameLog {
  return {
    ...base,
    logType: LogType.ROLL,
    type: RollType.Stat,
    rollLabel: "Edge",
    uid,
    characterId,
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
  };
}

function renderEntry(
  log: IGameLog,
  characters: Record<string, { name: string | null; uid: string }>,
) {
  vi.mocked(useUID).mockReturnValue("scott");
  vi.mocked(useUserName).mockImplementation(
    (uid) => userNames[uid ?? ""] ?? "Deleted User",
  );
  useGameCharactersStore.setState({ characters } as never);
  render(<GameLogEntry logId={log.id} log={log} />, { wrapper: TestWrapper });
  const heading =
    log.logType === LogType.ROLL
      ? screen.getByTestId("roll-prefix").textContent
      : screen.getByText(/, .*\.$/).textContent;
  return heading;
}

describe("app game log entry headings", () => {
  const kai = { name: "Kai", uid: "scott" };

  it.each([
    [
      "a message with no character",
      message("scott", null),
      {},
      `Scott, ${time}.`,
    ],
    [
      "a message from the owner's character",
      message("scott", "kai"),
      { kai },
      `Kai, ${time}.`,
    ],
    [
      "a message written for the owner",
      message("kira", "kai"),
      { kai },
      `Kai, sent by Kira, ${time}.`,
    ],
    [
      "a roll written for the owner",
      roll("kira", "kai"),
      { kai },
      `Kai, rolled by Kira, ${time}.`,
    ],
    [
      "a roll from a character still loading",
      roll("scott", "kai"),
      { kai: { name: null, uid: "scott" } },
      `Loading, ${time}.`,
    ],
    [
      "a roll from a character not in the game",
      roll("kira", "gone"),
      {},
      `Kira, ${time}.`,
    ],
  ] as const)("reads %s", (_, log, characters, expected) => {
    expect(renderEntry(log, characters)).toBe(expected);
  });
});

describe("library game log entry headings", () => {
  function readHeading(entry: {
    name: string;
    writtenBy?: string;
    guideOnly?: boolean;
  }) {
    render(
      <LibraryGameLog
        formatTime={() => "8:42 PM"}
        entries={[
          {
            id: "log",
            kind: "message",
            author: { name: entry.name, writtenBy: entry.writtenBy },
            timestamp,
            guideOnly: entry.guideOnly,
            message: "Hello",
          },
        ]}
      />,
    );
    return screen.getByText(/^Kai, .*\.$/).textContent;
  }

  it("reads who and when as the app does", () => {
    expect(readHeading({ name: "Kai", writtenBy: "sent by Kira" })).toBe(
      "Kai, sent by Kira, 8:42 PM.",
    );
  });

  it("differs on a Guide only entry: the library says so", () => {
    expect(readHeading({ name: "Kai", guideOnly: true })).toBe(
      "Kai, 8:42 PM, Guide only.",
    );
  });
});
