/**
 * The Tracks tab of the character column (migration slice 12): progress
 * tracks and clocks, for a player whose sheet this is, a player who can't
 * edit the sheet, and a viewer.
 */
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GamePermission, useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useSecondScreenStore } from "stores/secondScreen.store";
import { useTracksStore } from "stores/tracks.store";

import { askTheOracleEnumMap } from "data/askTheOracle";

import { TestWrapper } from "tests/TestWrapper";

import { CharacterEditPermissions } from "repositories/character.repository";
import { GameType } from "repositories/game.repository";
import {
  AskTheOracle,
  Difficulty,
  TrackStatus,
  TrackTypes,
} from "repositories/tracks.repository";

import { ICharacter } from "services/character.service";
import { ITrack } from "services/tracks.service";

import { TracksSection } from "../TracksSection";

const session = vi.hoisted(() => ({ uid: "me", secondScreen: false }));
const rollOracle = vi.hoisted(() => vi.fn());
const rollCompletion = vi.hoisted(() => vi.fn());

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({ useUID: () => session.uid }));
vi.mock("pages/games/characterSheet/hooks/useCharacterId", () => ({
  useCharacterId: () => "kira",
  useCharacterIdOptional: () => "kira",
}));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameId: () => "game",
  useGameIdOptional: () => "game",
}));
vi.mock("pages/games/hooks/useRollOracleAndAddToLog", () => ({
  useRollOracleAndAddToLog: () => rollOracle,
}));
vi.mock("pages/games/hooks/useRollCompleteProgressTrack", () => ({
  useRollCompleteProgressTrack: () => rollCompletion,
}));
vi.mock("hooks/datasworn/useMove", () => ({
  useMove: (id: string) =>
    id === "move:starforged/quest/fulfill_your_vow"
      ? { _id: id, name: "Fulfill Your Vow" }
      : undefined,
}));
vi.mock("hooks/useRollSummary", async (importOriginal) => ({
  ...(await importOriginal<typeof import("hooks/useRollSummary")>()),
  getRollAnnouncement: () => "Rolled.",
}));
vi.mock("hooks/advancedFeatures/useSecondScreenFeature", () => ({
  useSecondScreenFeature: () => session.secondScreen,
}));
// Bonds and connections have their own suites.
vi.mock("../CharacterWorldBonds", () => ({ CharacterWorldBonds: () => null }));
vi.mock("../CharacterConnections", () => ({
  CharacterConnections: () => null,
}));

const actions = {
  addProgressTrack: vi.fn(() => Promise.resolve()),
  addClock: vi.fn(() => Promise.resolve()),
  updateTrackValue: vi.fn(() => Promise.resolve()),
  updateTrackStatus: vi.fn(() => Promise.resolve()),
  updateClockFilledSegments: vi.fn(() => Promise.resolve()),
  updateClockSelectedOracle: vi.fn(() => Promise.resolve()),
  deleteTrack: vi.fn(() => Promise.resolve()),
};
const updateSecondScreenSettings = vi.fn(() => Promise.resolve());

const initialTracks = useTracksStore.getState();
const initialGame = useGameStore.getState();
const initialCharacters = useGameCharactersStore.getState();
const initialSecondScreen = useSecondScreenStore.getState();

const vow = {
  id: "vow",
  type: TrackTypes.Vow,
  label: "Find the Hollow Crown",
  difficulty: Difficulty.Dangerous,
  value: 8,
  status: TrackStatus.Active,
  createdDate: new Date(2026, 0, 1),
} as ITrack;
const clock = {
  id: "doom",
  type: TrackTypes.Clock,
  label: "Doom",
  segments: 6,
  value: 2,
  status: TrackStatus.Active,
  createdDate: new Date(2026, 0, 2),
} as ITrack;
const finished = {
  id: "fight",
  type: TrackTypes.Fray,
  label: "Bandit Ambush",
  difficulty: Difficulty.Formidable,
  value: 40,
  status: TrackStatus.Completed,
  createdDate: new Date(2026, 0, 3),
} as ITrack;

function setTracks(tracks: ITrack[], showCompletedTracks = false) {
  useTracksStore.setState({
    ...actions,
    tracks: Object.fromEntries(tracks.map((track) => [track.id, track])),
    loading: false,
    showCompletedTracks,
  } as unknown as Partial<ReturnType<typeof useTracksStore.getState>>);
}

beforeEach(() => {
  session.uid = "me";
  session.secondScreen = false;
  useGameStore.setState({
    gamePermissions: GamePermission.Player,
    game: { id: "game", gameType: GameType.Coop },
  } as unknown as Partial<ReturnType<typeof useGameStore.getState>>);
  useGameCharactersStore.setState({
    characters: {
      kira: {
        id: "kira",
        uid: "me",
        gameId: "game",
        name: "Kira",
        editPermissions: CharacterEditPermissions.OnlyOwner,
      } as unknown as ICharacter,
    },
  });
  useSecondScreenStore.setState({ settings: null, updateSecondScreenSettings });
  setTracks([vow, clock, finished]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  useTracksStore.setState(initialTracks, true);
  useGameStore.setState(initialGame, true);
  useGameCharactersStore.setState(initialCharacters, true);
  useSecondScreenStore.setState(initialSecondScreen, true);
});

function renderTracks() {
  return render(
    <MemoryRouter>
      <TracksSection />
    </MemoryRouter>,
    { wrapper: TestWrapper },
  );
}

/** A player in the game who isn't allowed to edit this character. */
function asAnotherPlayer() {
  session.uid = "bram";
}

function asViewer() {
  session.uid = "someone-else";
  useGameStore.setState({ gamePermissions: GamePermission.Viewer });
}

describe("the track list", () => {
  it("lists active tracks newest first and hides completed ones", () => {
    renderTracks();

    const names = screen
      .getAllByText(/Find the Hollow Crown|Doom|Bandit Ambush/)
      .map((element) => element.textContent);
    expect(names).toEqual(["Doom", "Find the Hollow Crown"]);
  });

  it("shows completed tracks once Show Completed is ticked", async () => {
    const user = userEvent.setup();
    renderTracks();

    await user.click(screen.getByRole("checkbox", { name: "Show Completed" }));
    expect(useTracksStore.getState().showCompletedTracks).toBe(true);
    expect(await screen.findByText("Bandit Ambush")).toBeInTheDocument();
  });

  it("says when there are no tracks, and when none is active", () => {
    setTracks([]);
    const { unmount } = renderTracks();
    expect(screen.getByText("No tracks yet")).toBeInTheDocument();
    unmount();

    setTracks([finished]);
    renderTracks();
    expect(screen.getByText("No active tracks")).toBeInTheDocument();
  });
});

describe("progress tracks", () => {
  it("marks progress by the rank's ticks", async () => {
    const user = userEvent.setup();
    renderTracks();

    await user.click(
      screen.getByRole("button", { name: "Increment Find the Hollow Crown" }),
    );
    expect(actions.updateTrackValue).toHaveBeenCalledWith("vow", 16);
  });

  it("completes an active track", async () => {
    const user = userEvent.setup();
    setTracks([vow]);
    renderTracks();

    await user.click(screen.getByRole("button", { name: /complete track/i }));
    expect(actions.updateTrackStatus).toHaveBeenCalledWith(
      "vow",
      TrackStatus.Completed,
    );
  });

  it("reopens and deletes a completed track after confirming", async () => {
    const user = userEvent.setup();
    setTracks([finished], true);
    renderTracks();

    await user.click(screen.getByRole("button", { name: /reopen track/i }));
    expect(actions.updateTrackStatus).toHaveBeenCalledWith(
      "fight",
      TrackStatus.Active,
    );

    await user.click(screen.getByRole("button", { name: /delete/i }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(actions.deleteTrack).toHaveBeenCalledWith("fight"),
    );
  });

  it("rolls the completion move for the sheet's editors only", async () => {
    const user = userEvent.setup();
    setTracks([vow]);
    const { unmount } = renderTracks();

    await user.click(
      screen.getByRole("button", { name: /roll fulfill your vow/i }),
    );
    expect(rollCompletion).toHaveBeenCalledWith(
      TrackTypes.Vow,
      "Find the Hollow Crown",
      8,
      "move:starforged/quest/fulfill_your_vow",
    );
    unmount();

    asAnotherPlayer();
    renderTracks();
    expect(
      screen.queryByRole("button", { name: /roll fulfill your vow/i }),
    ).not.toBeInTheDocument();
    // They can still mark the shared track.
    expect(
      screen.getByRole("button", { name: "Increment Find the Hollow Crown" }),
    ).toBeInTheDocument();
  });

  it("adds an iron vow from the Add Track menu", async () => {
    const user = userEvent.setup();
    setTracks([]);
    renderTracks();

    await user.click(screen.getByRole("button", { name: "Add Track" }));
    await user.click(await screen.findByRole("menuitem", { name: "Iron Vow" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(
      within(dialog).getByRole("textbox", { name: /title/i }),
      "Avenge Kai",
    );
    await user.click(
      within(dialog).getByRole("combobox", { name: /difficulty/i }),
    );
    await user.click(await screen.findByRole("option", { name: "Dangerous" }));
    await user.click(within(dialog).getByRole("button", { name: "Add Track" }));
    await waitFor(() =>
      expect(actions.addProgressTrack).toHaveBeenCalledWith(
        "game",
        TrackTypes.Vow,
        "Avenge Kai",
        // No description: today's dialog sends undefined.
        undefined,
        Difficulty.Dangerous,
      ),
    );
  });
});

describe("clocks", () => {
  it("fills a segment when the clock is pressed", async () => {
    const user = userEvent.setup();
    setTracks([clock]);
    renderTracks();

    await user.click(screen.getByRole("button", { name: /fill a segment/i }));
    expect(actions.updateClockFilledSegments).toHaveBeenCalledWith("doom", 3);
  });

  it("rolls progress on the oracle and adds a segment on a yes", async () => {
    const user = userEvent.setup();
    rollOracle.mockReturnValue({ result: { result: "Yes", match: false } });
    setTracks([clock]);
    renderTracks();

    await user.click(screen.getByRole("button", { name: /roll progress/i }));
    // With no odds saved, today's roll asks Almost Certain although the
    // picker shows Likely.
    expect(rollOracle).toHaveBeenCalledWith(
      askTheOracleEnumMap[AskTheOracle.AlmostCertain]._id,
      false,
      { announce: false },
    );
    expect(actions.updateClockFilledSegments).toHaveBeenCalledWith("doom", 3);
  });

  it("adds two segments on a match and none on a no", async () => {
    const user = userEvent.setup();
    setTracks([{ ...clock, oracleKey: AskTheOracle.Unlikely } as ITrack]);
    renderTracks();

    rollOracle.mockReturnValue({ result: { result: "No", match: false } });
    await user.click(screen.getByRole("button", { name: /roll progress/i }));
    expect(rollOracle).toHaveBeenLastCalledWith(
      askTheOracleEnumMap[AskTheOracle.Unlikely]._id,
      false,
      { announce: false },
    );
    expect(actions.updateClockFilledSegments).not.toHaveBeenCalled();

    rollOracle.mockReturnValue({ result: { result: "Yes", match: true } });
    await user.click(screen.getByRole("button", { name: /roll progress/i }));
    expect(actions.updateClockFilledSegments).toHaveBeenCalledWith("doom", 4);
  });

  it("can't roll a full clock", () => {
    setTracks([{ ...clock, value: 6 } as ITrack]);
    renderTracks();

    expect(
      screen.getByRole("button", { name: /roll progress/i }),
    ).toBeDisabled();
  });

  it("completes an active clock", async () => {
    const user = userEvent.setup();
    setTracks([clock]);
    renderTracks();

    await user.click(screen.getByRole("button", { name: /complete clock/i }));
    expect(actions.updateTrackStatus).toHaveBeenCalledWith(
      "doom",
      TrackStatus.Completed,
    );
  });
});

describe("the second screen", () => {
  it("opens and closes a track there when the feature is on", async () => {
    const user = userEvent.setup();
    session.secondScreen = true;
    setTracks([vow]);
    renderTracks();

    await user.click(
      screen.getByRole("button", { name: /open on second screen/i }),
    );
    expect(updateSecondScreenSettings).toHaveBeenCalledWith("game", {
      type: "track",
      trackId: "vow",
    });

    useSecondScreenStore.setState({
      settings: { type: "track", trackId: "vow" },
    });
    await user.click(
      await screen.findByRole("button", { name: /close on second screen/i }),
    );
    expect(updateSecondScreenSettings).toHaveBeenLastCalledWith("game", null);
  });
});

describe("a viewer", () => {
  it("can't add or change anything", () => {
    asViewer();
    renderTracks();

    expect(
      screen.queryByRole("button", { name: "Add Track" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /increment/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /roll progress/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /complete/i }),
    ).not.toBeInTheDocument();
  });
});
