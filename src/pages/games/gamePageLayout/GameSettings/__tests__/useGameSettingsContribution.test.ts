import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMenuState } from "stores/menuState";

import { useGameSettingsContribution } from "../useGameSettingsContribution";

const state = vi.hoisted(() => ({
  gameId: "game-1" as string | undefined,
  game: { name: "The Forsaken" } as { name: string } | undefined,
  gamePermissions: "guide" as string | null,
  gameType: "solo",
  characters: { a: {} } as Record<string, unknown>,
  characterId: undefined as string | undefined,
  characterName: "Kira",
  canEdit: false,
  isOwner: false,
  playSoundOnLog: true,
  setPlaySoundOnLog: vi.fn(),
  deleteCharacter: vi.fn(),
  deleteGame: vi.fn(),
}));

vi.mock("stores/game.store", () => ({
  GamePermission: { Guide: "guide", Player: "player", Viewer: "viewer" },
  useGameStore: (selector: (store: typeof state) => unknown) => selector(state),
}));
vi.mock("stores/gameCharacters.store", () => ({
  useGameCharactersStore: (selector: (store: typeof state) => unknown) =>
    selector(state),
  useGameCharacter: (selector: (character: { name: string }) => unknown) =>
    selector({ name: state.characterName }),
}));
vi.mock("stores/gameLog.store", () => ({
  useGameLogStore: (selector: (store: typeof state) => unknown) =>
    selector(state),
}));
vi.mock("repositories/game.repository", () => ({
  GameType: { Solo: "solo", Coop: "co-op", Guided: "guided" },
}));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameIdOptional: () => state.gameId,
}));
vi.mock("pages/games/gamePageLayout/hooks/usePermissions", () => ({
  useGamePermissions: () => ({
    gamePermission: state.gamePermissions,
    gameType: state.gameType,
  }),
}));
vi.mock("pages/games/characterSheet/hooks/useCharacterId", () => ({
  useCharacterIdOptional: () => state.characterId,
}));
vi.mock("pages/games/characterSheet/hooks/useCanEditCharacter", () => ({
  useCanEditCharacter: () => state.canEdit,
}));
vi.mock("pages/games/characterSheet/hooks/useIsOwnerOfCharacter", () => ({
  useIsOwnerOfCharacter: () => state.isOwner,
}));
vi.mock(
  "pages/games/characterSheet/components/CharacterSettingsMenu/useDeleteCharacter",
  () => ({ useDeleteCharacter: () => state.deleteCharacter }),
);
vi.mock("pages/games/overviewSheet/gameSettings/useDeleteGame", () => ({
  useDeleteGame: () => state.deleteGame,
}));

beforeEach(() => {
  state.gameId = "game-1";
  state.game = { name: "The Forsaken" };
  state.gamePermissions = "guide";
  state.gameType = "solo";
  state.characterId = undefined;
  state.canEdit = false;
  state.isOwner = false;
  useMenuState.setState({
    isColorSchemeDialogOpen: false,
    isGameThemeDialogOpen: false,
    isGameNameDialogOpen: false,
  });
});

describe("useGameSettingsContribution", () => {
  it("adds nothing until the game has loaded", () => {
    state.game = undefined;
    const { result } = renderHook(() => useGameSettingsContribution());
    expect(result.current).toBeNull();
  });

  it("gives a Guide the game's settings and its theme", () => {
    const { result } = renderHook(() => useGameSettingsContribution());
    expect(result.current?.game).toEqual({
      name: "The Forsaken",
      isGuide: true,
      solo: true,
      characterCount: 1,
    });
    expect(result.current?.character).toBeUndefined();
    expect(result.current?.themeTarget).toBe("game");

    act(() => result.current?.onSelect("theme"));
    expect(useMenuState.getState().isGameThemeDialogOpen).toBe(true);
    act(() => result.current?.onSelect("gameName"));
    expect(useMenuState.getState().isGameNameDialogOpen).toBe(true);
  });

  it("adds the open character the person can edit, and its theme", () => {
    state.characterId = "a";
    state.canEdit = true;
    state.isOwner = true;
    const { result } = renderHook(() => useGameSettingsContribution());
    expect(result.current?.character).toEqual({ name: "Kira", isOwner: true });
    expect(result.current?.themeTarget).toBe("character");

    act(() => result.current?.onSelect("theme"));
    expect(useMenuState.getState().isColorSchemeDialogOpen).toBe(true);
    expect(useMenuState.getState().isGameThemeDialogOpen).toBe(false);
  });

  it("leaves out a character the person can't edit, and any theme", () => {
    state.characterId = "a";
    state.gamePermissions = "viewer";
    state.gameType = "guided";
    const { result } = renderHook(() => useGameSettingsContribution());
    expect(result.current?.character).toBeUndefined();
    expect(result.current?.game?.isGuide).toBe(false);
    expect(result.current?.themeTarget).toBeUndefined();
  });

  it("keeps the same contribution across renders", () => {
    const { result, rerender } = renderHook(() =>
      useGameSettingsContribution(),
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
