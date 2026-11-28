import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCreateCharacterStore } from "stores/createCharacter.store";

import { TestWrapper } from "tests/TestWrapper";

import AddCharacter from "../AddCharacter";

// Characterization tests for the add character page (slice 16): its three
// sections, creating the character and opening its sheet, and a failed
// create. The sections have their own tests and are stubbed here.

const mocks = vi.hoisted(() => ({ uid: "me" as string | undefined }));

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("hooks/useSendPageViewEvents", () => ({
  PageCategory: { GameCharacterCreate: "game-character-create" },
  useSendPageViewEvent: () => {},
}));
vi.mock("stores/auth.store", () => ({ useUID: () => mocks.uid }));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameId: () => "game",
  useGameIdOptional: () => "game",
}));
vi.mock("pages/games/create/components/CharacterDetails", () => ({
  CharacterDetails: () => <p>Details fields</p>,
}));
vi.mock("pages/games/create/components/Stats", () => ({
  Stats: () => <p>Stat fields</p>,
}));
vi.mock("pages/games/create/components/Assets", () => ({
  Assets: () => <p>Asset fields</p>,
}));

function LocationDisplay() {
  return <output aria-label="Location">{useLocation().pathname}</output>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/games/game/create"]}>
      <Routes>
        <Route path="/games/:gameId/create" element={<AddCharacter />} />
        <Route path="*" element={null} />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>,
    { wrapper: TestWrapper },
  );
}

afterEach(() => {
  mocks.uid = "me";
  act(() => useCreateCharacterStore.getState().reset());
});

describe("add character", () => {
  it("shows the three sections under their headings", () => {
    renderPage();

    for (const heading of ["Character Details", "Character Stats", "Assets"]) {
      expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    }
    expect(screen.getByText("Details fields")).toBeVisible();
    expect(screen.getByText("Stat fields")).toBeVisible();
    expect(screen.getByText("Asset fields")).toBeVisible();
  });

  it("creates the character and opens its sheet", async () => {
    const user = userEvent.setup();
    const createCharacter = vi.fn(() => Promise.resolve("kira"));
    useCreateCharacterStore.setState({
      createCharacter,
      characterName: "Kira",
    });
    renderPage();

    await user.click(screen.getByRole("button", { name: "Add Character" }));
    expect(createCharacter).toHaveBeenCalledWith("game", "me");
    await waitFor(() =>
      expect(
        screen.getByRole("status", { name: "Location" }),
      ).toHaveTextContent("/games/game/c/kira"),
    );
    expect(useCreateCharacterStore.getState().characterName).toBe("");
  });

  it("says so when the character could not be created", async () => {
    const user = userEvent.setup();
    useCreateCharacterStore.setState({
      createCharacter: () => Promise.reject(new Error("nope")),
    });
    renderPage();

    await user.click(screen.getByRole("button", { name: "Add Character" }));
    expect(await screen.findByText("Error creating character")).toBeVisible();
    expect(screen.getByRole("button", { name: "Add Character" })).toBeEnabled();
    expect(screen.getByRole("status", { name: "Location" })).toHaveTextContent(
      "/games/game/create",
    );
  });

  it("shows nothing while signed out", () => {
    mocks.uid = undefined;
    renderPage();
    expect(
      screen.queryByRole("button", { name: "Add Character" }),
    ).not.toBeInTheDocument();
  });
});
