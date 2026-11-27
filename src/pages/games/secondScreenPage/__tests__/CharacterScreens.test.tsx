/**
 * The second screen's character views: the column of
 * every character beside the main screen, and one character on the main
 * screen.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGameCharactersStore } from "stores/gameCharacters.store";

import { TestWrapper } from "tests/TestWrapper";

import { InitiativeStatus } from "repositories/character.repository";

import { ICharacter } from "services/character.service";

import { CharacterMain } from "../CharacterMain";
import { CharacterSidebar } from "../CharacterSidebar";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/character.store", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useLoadCharacterPortrait: () => {},
  useCharacterPortrait: () => ({ url: "portrait.png" }),
}));

const initialCharacters = useGameCharactersStore.getState();

function character(changes: Partial<ICharacter>): ICharacter {
  return {
    uid: "me",
    gameId: "game",
    conditionMeters: {},
    initiativeStatus: InitiativeStatus.OutOfCombat,
    profileImage: null,
    ...changes,
  } as unknown as ICharacter;
}

beforeEach(() => {
  useGameCharactersStore.setState({
    characters: {
      kira: character({
        id: "kira",
        name: "Kira",
        conditionMeters: { health: 3, spirit: 2 },
        initiativeStatus: InitiativeStatus.HasInitiative,
      }),
      bram: character({ id: "bram", name: "Bram" }),
    },
  });
});

afterEach(() => {
  cleanup();
  useGameCharactersStore.setState(initialCharacters, true);
});

describe("the characters column", () => {
  it("lists every character by name, with initiative, health and spirit", () => {
    render(<CharacterSidebar />, { wrapper: TestWrapper });

    expect(screen.getByText("Characters")).toBeInTheDocument();
    const names = screen
      .getAllByText(/^(Bram|Kira)$/)
      .map((element) => element.textContent);
    expect(names).toEqual(["Bram", "Kira"]);

    expect(screen.getByText("Has Initiative")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("heads the list and names each meter for screen readers", () => {
    render(<CharacterSidebar />, { wrapper: TestWrapper });

    expect(
      screen.getByRole("heading", { level: 2, name: "Characters" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(
      ["Health", "Spirit", "Health", "Spirit"],
    );
  });

  it("shows full health and spirit for a character who has none saved", () => {
    render(<CharacterSidebar />, { wrapper: TestWrapper });

    expect(screen.getAllByText("5")).toHaveLength(2);
  });
});

describe("one character on the main screen", () => {
  it("names the character in the page heading", () => {
    render(<CharacterMain characterId="kira" />, { wrapper: TestWrapper });

    expect(
      screen.getByRole("heading", { level: 1, name: "Kira" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows the portrait without repeating the name", () => {
    useGameCharactersStore.setState((state) => {
      state.characters.kira.profileImage = {
        filename: "kira.png",
      } as ICharacter["profileImage"];
    });
    const { container } = render(<CharacterMain characterId="kira" />, {
      wrapper: TestWrapper,
    });

    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(
      screen.getByRole("heading", { level: 1, name: "Kira" }),
    ).toBeInTheDocument();
  });
});
