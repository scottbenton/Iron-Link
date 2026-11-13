import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditOrCreateClockDialog } from "../EditOrCreateClockDialog";

const actions = vi.hoisted(() => ({
  addClock: vi.fn(),
  updateClock: vi.fn(),
}));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/tracks.store", () => ({
  useTracksStore: (selector: (store: typeof actions) => unknown) =>
    selector(actions),
}));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameId: () => "game-1",
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EditOrCreateClockDialog", () => {
  it("adds the clock with Enter, keeping Enter for new lines in the description", async () => {
    const user = userEvent.setup();
    actions.addClock.mockReturnValue(new Promise(() => {}));
    render(<EditOrCreateClockDialog open handleClose={vi.fn()} />);

    await user.type(
      screen.getByRole("textbox", { name: "Description" }),
      "First{Enter}Second",
    );
    expect(actions.addClock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^6 segments/ }));
    expect(actions.addClock).not.toHaveBeenCalled();

    await user.type(
      screen.getByRole("textbox", { name: "Title" }),
      "Doom{Enter}{Enter}",
    );
    expect(actions.addClock).toHaveBeenCalledTimes(1);
    expect(actions.addClock).toHaveBeenCalledWith(
      "game-1",
      "Doom",
      "First\nSecond",
      6,
    );
  });

  it("shows its own error when Enter is pressed without a title", async () => {
    const user = userEvent.setup();
    render(<EditOrCreateClockDialog open handleClose={vi.fn()} />);

    await user.type(screen.getByRole("textbox", { name: "Title" }), "{Enter}");
    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(actions.addClock).not.toHaveBeenCalled();
  });
});
