import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGameStore } from "stores/game.store";

import { IGame } from "services/game.service";

import { GameNameDialog } from "../GameNameDialog";
import { GameRulesetChooserDialog } from "../GameRulesetChooserDialog";

// Characterization tests for the game settings dialogs (slice 16): renaming
// the game and choosing its rulesets.

const mocks = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameId: () => "game",
  useGameIdOptional: () => "game",
}));
vi.mock("providers/SnackbarProvider", () => ({
  useSnackbar: () => ({ error: mocks.error, success: vi.fn() }),
}));
vi.mock("ui/components/Toast", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ui/components/Toast")>();
  return { ...actual, toast: { ...actual.toast, error: mocks.error } };
});
// The selector has its own tests; this stand-in turns rulesets on and off.
vi.mock("components/datasworn/RulesPackageSelector", () => ({
  RulesPackageSelector: (props: {
    activeRulesetConfig: Record<string, boolean>;
    onRulesetChange: (key: string, active: boolean) => void;
  }) => (
    <>
      {["classic", "starforged"].map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={!!props.activeRulesetConfig[key]}
          onClick={() =>
            props.onRulesetChange(key, !props.activeRulesetConfig[key])
          }
        >
          {key}
        </button>
      ))}
    </>
  ),
}));

const updateGameName = vi.fn(() => Promise.resolve());
const updateGameRulesPackages = vi.fn(() => Promise.resolve());

function setGame(extra: Partial<IGame> = {}) {
  useGameStore.setState({
    game: {
      id: "game",
      name: "The Ironlands",
      rulesets: { classic: true },
      expansions: {},
      playset: {},
      worldId: null,
      ...extra,
    } as unknown as IGame,
    updateGameName,
    updateGameRulesPackages,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setGame();
});

describe("Change Game Name", () => {
  it("saves the new name on Enter and closes", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<GameNameDialog open onClose={onClose} />);

    const dialog = screen.getByRole("dialog", { name: "Change Game Name" });
    const field = within(dialog).getByRole("textbox", { name: "Game Name" });
    expect(field).toHaveValue("The Ironlands");

    await user.clear(field);
    await user.type(field, "The Forge{Enter}");
    expect(updateGameName).toHaveBeenCalledWith("game", "The Forge");
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("closes on Cancel without saving", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<GameNameDialog open onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
    expect(updateGameName).not.toHaveBeenCalled();
  });
});

describe("Change Game Ruleset", () => {
  it("saves the chosen rulesets and closes", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<GameRulesetChooserDialog open onClose={onClose} />);

    const dialog = screen.getByRole("dialog", { name: "Change Game Ruleset" });
    await user.click(
      within(dialog).getByRole("button", { name: "starforged" }),
    );
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(updateGameRulesPackages).toHaveBeenCalledWith(
      "game",
      { classic: true, starforged: true },
      {},
      {},
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("refuses to save with no ruleset", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<GameRulesetChooserDialog open onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "classic" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mocks.error).toHaveBeenCalledWith("No ruleset selected");
    expect(updateGameRulesPackages).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("warns that a linked world's oracles may change, once something changed", async () => {
    const user = userEvent.setup();
    setGame({ worldId: "world" } as Partial<IGame>);
    render(<GameRulesetChooserDialog open onClose={vi.fn()} />);

    const warning = "Some world fields may roll different oracles.";
    expect(screen.queryByText(warning)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "starforged" }));
    expect(screen.getByText(warning)).toBeVisible();
  });
});
