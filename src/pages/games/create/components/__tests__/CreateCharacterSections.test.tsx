import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { useCreateCharacterStore } from "stores/createCharacter.store";

import { TestWrapper } from "tests/TestWrapper";
import { RULESETS, loadRules } from "tests/datasworn/rulesets";

import { Assets } from "../Assets";
import { CharacterDetails } from "../CharacterDetails";
import { Stats } from "../Stats";

// Characterization tests for the character sections that create game and
// add character share (slice 16): the name, the portrait, stats and assets,
// all written to the create character store.

const mocks = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("providers/SnackbarProvider/useSnackbar", () => ({
  useSnackbar: () => ({ error: mocks.error, success: vi.fn() }),
}));
vi.mock("ui/components/Toast", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ui/components/Toast")>();
  return { ...actual, toast: { ...actual.toast, error: mocks.error } };
});
// The cropper draws on a canvas, which jsdom lacks.
vi.mock("react-avatar-editor", () => ({ default: () => null }));

const STARSHIP = "asset:starforged/command_vehicle/starship";

beforeAll(() => {
  loadRules(RULESETS.starforged.slice(0, 1));
  globalThis.PointerEvent ??= class extends MouseEvent {} as never;
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  act(() => useCreateCharacterStore.getState().reset());
  mocks.error.mockClear();
});

async function renderSection(element: React.ReactElement) {
  await act(async () => {
    render(element, { wrapper: TestWrapper });
  });
}

describe("character details", () => {
  it("writes the name to the new character", async () => {
    const user = userEvent.setup();
    await renderSection(<CharacterDetails />);

    await user.type(
      screen.getByRole("textbox", { name: "Character Name" }),
      "Kira",
    );
    expect(useCreateCharacterStore.getState().characterName).toBe("Kira");
  });

  it("uploads a portrait through its dialog", async () => {
    const user = userEvent.setup();
    await renderSection(<CharacterDetails />);

    await user.click(screen.getByRole("button", { name: /portrait/i }));
    const dialog = await screen.findByRole("dialog", { name: /portrait/i });
    const input = dialog.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("No file input");
    const file = new File(["portrait"], "kira.png", { type: "image/png" });
    await user.upload(input, file);
    await user.click(within(dialog).getByRole("button", { name: "Upload" }));

    await waitFor(() =>
      expect(useCreateCharacterStore.getState().portrait.image).toBe(file),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("refuses a portrait over the size limit", async () => {
    const user = userEvent.setup();
    await renderSection(<CharacterDetails />);

    await user.click(screen.getByRole("button", { name: /portrait/i }));
    const dialog = await screen.findByRole("dialog", { name: /portrait/i });
    const input = dialog.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("No file input");
    const file = new File(["x"], "huge.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 3 * 1024 * 1024 });
    await user.upload(input, file);

    expect(mocks.error).toHaveBeenCalledWith(
      "File is too large. The max file size is 2 MB.",
    );
    await user.click(within(dialog).getByRole("button", { name: "Upload" }));
    expect(useCreateCharacterStore.getState().portrait.image).toBeNull();
  });
});

describe("stats", () => {
  it("sets each stat from zero", async () => {
    const user = userEvent.setup();
    await renderSection(<Stats />);

    expect(screen.getByText("Select a value for each stat.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /add 1 to edge/i }));
    await user.click(screen.getByRole("button", { name: /add 1 to edge/i }));
    await user.click(
      screen.getByRole("button", { name: /subtract 1 from wits/i }),
    );

    expect(useCreateCharacterStore.getState().stats).toEqual({
      edge: 2,
      wits: -1,
    });
  });
});

describe("assets", () => {
  it("starts empty with a way to add one", async () => {
    await renderSection(<Assets />);

    expect(
      screen.getByText(
        "Add an asset now, or add one later from the character sheet.",
      ),
    ).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Add Asset" })).toHaveLength(
      1,
    );
  });

  it("removes an added asset", async () => {
    const user = userEvent.setup();
    act(() =>
      useCreateCharacterStore.getState().addAsset(
        {
          dataswornAssetId: STARSHIP,
          enabledAbilities: {},
          controlValues: {},
          optionValues: {},
        },
        true,
      ),
    );
    await renderSection(<Assets />);

    expect(screen.getByRole("heading", { name: "Starship" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Remove Starship" }));
    expect(useCreateCharacterStore.getState().gameAssets).toEqual([]);
    expect(
      screen.queryByRole("heading", { name: "Starship" }),
    ).not.toBeInTheDocument();
  });
});
