/**
 * The character sheet's assets, read through roles and names: shared
 * assets first, Show all abilities, adding through the picker, deleting
 * with a confirmation, and what a reader without edit rights sees.
 */
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import {
  MockedFunction,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { toast } from "ui/components/Toast";

import { useAssetsStore } from "stores/assets.store";

import { TestWrapper } from "tests/TestWrapper";
import { RULESETS, loadRules } from "tests/datasworn/rulesets";

import { IAsset } from "services/asset.service";

import { useCanEditCharacter } from "../../../hooks/useCanEditCharacter";
import { useCharacterIdOptional } from "../../../hooks/useCharacterId";
import { AssetsSection } from "../AssetsSection";

vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameId: () => "game-1",
}));
vi.mock("../../../hooks/useCharacterId", () => ({
  useCharacterIdOptional: vi.fn(),
}));
vi.mock("../../../hooks/useCanEditCharacter", () => ({
  useCanEditCharacter: vi.fn(),
}));
vi.mock("pages/games/hooks/useRollStatAndAddToLog", () => ({
  useRollStatAndAddToLog: () => vi.fn(),
}));

const mockCharacterId = useCharacterIdOptional as MockedFunction<
  typeof useCharacterIdOptional
>;
const mockCanEdit = useCanEditCharacter as MockedFunction<
  typeof useCanEditCharacter
>;

const PROTOCOL_BOT = "asset:starforged/companion/protocol_bot";
const STARSHIP = "asset:starforged/command_vehicle/starship";
const BANSHEE = "asset:starforged/companion/banshee";

function asset(
  id: string,
  dataswornAssetId: string,
  order: number,
  owner: { characterId?: string; gameId?: string },
): IAsset {
  return {
    id,
    dataswornAssetId,
    order,
    characterId: owner.characterId ?? null,
    gameId: owner.gameId ?? null,
    enabledAbilities: {},
    controlValues: {},
    optionValues: {},
  } as IAsset;
}

const addAsset = vi.fn(() => Promise.resolve());
const deleteAsset = vi.fn(() => Promise.resolve());

function seedAssets(assets: IAsset[]) {
  useAssetsStore.setState({
    assets: Object.fromEntries(assets.map((item) => [item.id, item])),
    addAsset,
    deleteAsset,
  } as never);
}

async function renderSection() {
  await act(async () => {
    render(<AssetsSection />, { wrapper: TestWrapper });
  });
}

function assetHeadings() {
  return screen
    .getAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent?.trim());
}

/** Opens the picker and adds an asset from one of its collections. */
async function addFromPicker(
  user: UserEvent,
  collectionName: string,
  assetName: string,
) {
  await user.click(screen.getByRole("button", { name: /^add assets?$/i }));
  const dialog = await screen.findByRole("dialog");
  await user.click(
    within(dialog).getByRole("button", {
      name: new RegExp(`^${collectionName}`),
    }),
  );
  await user.click(
    await within(dialog).findByRole("button", { name: `Add ${assetName}` }),
  );
}

describe("AssetsSection", () => {
  beforeAll(() => {
    loadRules(RULESETS.starforged.slice(0, 1));
    // jsdom has no PointerEvent, which Base UI's checkbox dispatches.
    globalThis.PointerEvent ??= class extends MouseEvent {} as never;
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(() => {
    mockCharacterId.mockReturnValue("character-1");
    mockCanEdit.mockReturnValue(true);
    addAsset.mockClear();
    deleteAsset.mockClear();
    seedAssets([
      asset("a2", BANSHEE, 2, { characterId: "character-1" }),
      asset("a1", PROTOCOL_BOT, 1, { characterId: "character-1" }),
      asset("s1", STARSHIP, 1, { gameId: "game-1" }),
      asset("other", PROTOCOL_BOT, 1, { characterId: "character-2" }),
    ]);
  });

  afterEach(() => {
    act(() => toast.dismissAll());
  });

  it("lists shared assets first, then the character's in order", async () => {
    await renderSection();
    expect(assetHeadings()).toEqual(["Starship", "Protocol Bot", "Banshee"]);
  });

  it("hides unchecked abilities until Show all abilities is ticked", async () => {
    const user = userEvent.setup();
    await renderSection();
    const second = /^When you first visit or interact/;
    expect(
      screen.queryByRole("checkbox", { name: second }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByText("Show all abilities"));
    expect(screen.getByRole("checkbox", { name: second })).toBeInTheDocument();
  });

  it("adds a character's asset after the last one", async () => {
    const user = userEvent.setup();
    await renderSection();
    await addFromPicker(user, "Companion Assets", "Protocol Bot");
    await waitFor(() => expect(addAsset).toHaveBeenCalledTimes(1));
    expect(addAsset).toHaveBeenCalledWith({
      dataswornAssetId: PROTOCOL_BOT,
      enabledAbilities: {},
      controlValues: {},
      optionValues: {},
      characterId: "character-1",
      gameId: null,
      order: 3,
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("adds a shared asset to the game", async () => {
    const user = userEvent.setup();
    await renderSection();
    await addFromPicker(user, "Command Vehicle Assets", "Starship");
    await waitFor(() => expect(addAsset).toHaveBeenCalledTimes(1));
    expect(addAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        dataswornAssetId: STARSHIP,
        characterId: null,
        gameId: "game-1",
        order: 2,
      }),
    );
  });

  it("refuses a character's asset on the game overview", async () => {
    const user = userEvent.setup();
    mockCharacterId.mockReturnValue(undefined);
    await renderSection();
    // The overview lists only the shared assets.
    expect(assetHeadings()).toEqual(["Starship"]);
    await addFromPicker(user, "Companion Assets", "Protocol Bot");
    expect(
      await screen.findByText(
        "Assets that are not shared can only be added to characters",
      ),
    ).toBeInTheDocument();
    expect(addAsset).not.toHaveBeenCalled();
  });

  it("deletes an asset once confirmed", async () => {
    const user = userEvent.setup();
    await renderSection();
    await user.click(
      screen.getByRole("button", { name: "Delete Protocol Bot" }),
    );
    const confirm = await screen.findByRole("alertdialog");
    expect(within(confirm).getByText("Delete Asset")).toBeInTheDocument();
    await user.click(within(confirm).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(deleteAsset).toHaveBeenCalledWith("a1"));
  });

  it("keeps the asset when the deletion is cancelled", async () => {
    const user = userEvent.setup();
    await renderSection();
    await user.click(
      screen.getByRole("button", { name: "Delete Protocol Bot" }),
    );
    const confirm = await screen.findByRole("alertdialog");
    await user.click(within(confirm).getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(deleteAsset).not.toHaveBeenCalled();
  });

  it("offers no Add Assets or Delete to a reader without edit rights", async () => {
    mockCanEdit.mockReturnValue(false);
    await renderSection();
    expect(
      screen.queryByRole("button", { name: /^add assets?$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Show all abilities")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete Protocol Bot" }),
    ).not.toBeInTheDocument();
  });
});
