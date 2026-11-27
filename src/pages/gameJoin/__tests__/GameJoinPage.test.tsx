import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TestWrapper } from "tests/TestWrapper";

import GameJoinPage from "../GameJoinPage";

// Characterization tests for joining a game from an invite (slice 6).

const auth = vi.hoisted(() => ({ uid: "player-1" as string | undefined }));
const service = vi.hoisted(() => ({
  getGameInviteInfo: vi.fn(),
  addPlayer: vi.fn(),
}));

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({ useUID: () => auth.uid }));
vi.mock("services/game.service", () => ({ GameService: service }));
vi.mock("hooks/useSendPageViewEvents", () => ({
  PageCategory: { GameJoin: "game-join" },
  useSendPageViewEvent: () => {},
}));

function renderPage(path = "/join/invite-key") {
  return render(
    <TestWrapper>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={"/join/:inviteKey"} element={<GameJoinPage />} />
          <Route path={"/join"} element={<GameJoinPage />} />
          <Route path={"/games/:gameId"} element={<p>Game page</p>} />
        </Routes>
      </MemoryRouter>
    </TestWrapper>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  auth.uid = "player-1";
});

describe("GameJoinPage", () => {
  it("offers to join the invited game", async () => {
    service.getGameInviteInfo.mockResolvedValue({
      name: "The Ironlands",
      gameType: "solo",
    });
    renderPage();

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Join The Ironlands",
      }),
    ).toBeInTheDocument();
    expect(service.getGameInviteInfo).toHaveBeenCalledWith("invite-key");
    expect(document.title).toBe("Join The Ironlands | Iron Link");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("joins and opens the game", async () => {
    const user = userEvent.setup();
    service.getGameInviteInfo.mockResolvedValue({
      name: "The Ironlands",
      gameType: "solo",
    });
    service.addPlayer.mockResolvedValue("game-9");
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Join" }));
    expect(service.addPlayer).toHaveBeenCalledWith("invite-key", "player-1");
    expect(await screen.findByText("Game page")).toBeInTheDocument();
  });

  it("opens the game straight away for a player already in it", async () => {
    service.getGameInviteInfo.mockResolvedValue({ gameId: "game-9" });
    renderPage();

    expect(await screen.findByText("Game page")).toBeInTheDocument();
    expect(service.addPlayer).not.toHaveBeenCalled();
  });

  it("says when the game cannot be loaded", async () => {
    service.getGameInviteInfo.mockRejectedValue(new Error("Network"));
    renderPage();

    expect(await screen.findByText("Failed to load game")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Join" })).toBeNull();
  });

  it("says when the join fails", async () => {
    const user = userEvent.setup();
    service.getGameInviteInfo.mockResolvedValue({
      name: "The Ironlands",
      gameType: "solo",
    });
    service.addPlayer.mockRejectedValue(new Error("Full"));
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Join" }));
    expect(await screen.findByText("Failed to join game")).toBeInTheDocument();
  });

  it("cannot find a game without an invite or a signed in player", async () => {
    auth.uid = undefined;
    renderPage();
    expect(await screen.findByText("Could not find game")).toBeInTheDocument();
    expect(service.getGameInviteInfo).not.toHaveBeenCalled();
  });

  // Current behaviour, recorded in the migration's changes list: nothing
  // stops a second click while the first join is in flight.
  it("sends a join for every click", async () => {
    const user = userEvent.setup();
    service.getGameInviteInfo.mockResolvedValue({
      name: "The Ironlands",
      gameType: "solo",
    });
    service.addPlayer.mockReturnValue(new Promise(() => {}));
    renderPage();

    const join = await screen.findByRole("button", { name: "Join" });
    await user.click(join);
    await user.click(join);
    await waitFor(() => expect(service.addPlayer).toHaveBeenCalledTimes(2));
  });
});
