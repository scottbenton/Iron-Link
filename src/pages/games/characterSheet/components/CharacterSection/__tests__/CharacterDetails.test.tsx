import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGameCharactersStore } from "stores/gameCharacters.store";

import { TestWrapper } from "tests/TestWrapper";

import { InitiativeStatus } from "repositories/character.repository";

import { ICharacter } from "services/character.service";

import { CharacterDetails } from "../CharacterDetails";

const mocks = vi.hoisted(() => ({ isMobile: false, showAccessChip: true }));

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("hooks/useIsMobile", () => ({ useIsMobile: () => mocks.isMobile }));
vi.mock("pages/games/characterSheet/hooks/useCharacterId", () => ({
  useCharacterId: () => "kira",
  useCharacterIdOptional: () => "kira",
}));
vi.mock("components/characters/PortraitAvatar", () => ({
  PortraitAvatar: () => <div data-testid="portrait" />,
}));
vi.mock("../useCharacterInitiativeStatus", () => ({
  useCharacterInitiativeStatus: () => ({
    status: InitiativeStatus.OutOfCombat,
  }),
}));
vi.mock("../CharacterAccessChip", () => ({
  CharacterAccessChip: () =>
    mocks.showAccessChip ? <span>Shared by Ada</span> : null,
}));

beforeEach(() => {
  useGameCharactersStore.setState({
    characters: {
      kira: {
        id: "kira",
        name: "Kira",
        profileImage: { filename: "kira.png", position: { x: 0, y: 0 } },
      } as unknown as ICharacter,
    },
  });
});

afterEach(() => {
  cleanup();
  mocks.isMobile = false;
  mocks.showAccessChip = true;
});

describe("CharacterDetails", () => {
  it("shows the portrait, name and initiative on wide screens", () => {
    render(<CharacterDetails />, { wrapper: TestWrapper });

    expect(screen.getByTestId("portrait")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Kira" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Out of Combat")).toBeInTheDocument();
    expect(screen.getByText("Shared by Ada")).toBeInTheDocument();
  });

  it("leaves the portrait and name to the top bar on phones", () => {
    mocks.isMobile = true;
    render(<CharacterDetails />, { wrapper: TestWrapper });

    expect(screen.queryByTestId("portrait")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByText("Out of Combat")).not.toBeInTheDocument();
    expect(screen.getByText("Shared by Ada")).toBeInTheDocument();
  });
});
