/**
 * The overview panel of the character column: the
 * header, stats, meters, impacts, legacy tracks and experience, for the
 * sheet's owner, a player it is shared with, and a viewer.
 */
import { Datasworn } from "@datasworn-community/core";
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

import { useDataswornTreeStore } from "stores/dataswornTree.store";
import { GamePermission, useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useMenuState } from "stores/menuState";
import { useUsersStore } from "stores/users.store";

import {
  elegyRulesetConfig,
  ironswornRulesetConfig,
} from "data/package.config";

import { TestWrapper } from "tests/TestWrapper";

import {
  CharacterEditPermissions,
  InitiativeStatus,
} from "repositories/character.repository";
import { GameType } from "repositories/game.repository";

import { ICharacter } from "services/character.service";

import { CharacterDetails } from "../CharacterDetails";
import { ConditionMeters } from "../ConditionMeters";
import { ExperienceSection } from "../ExperienceSection";
import { ImpactsSection } from "../ImpactsSection";
import { LegacyTracks } from "../LegacyTracks";
import { Stats } from "../Stats";

const session = vi.hoisted(() => ({ uid: "me" }));
const rollStat = vi.hoisted(() => vi.fn(() => ({ action: 3 })));

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
vi.mock("pages/games/hooks/useRollStatAndAddToLog", () => ({
  useRollStatAndAddToLog: () => rollStat,
}));
vi.mock("pages/games/hooks/useRollStatAndAddToLog.ts", () => ({
  useRollStatAndAddToLog: () => rollStat,
}));

const updates = {
  updateCharacterAdds: vi.fn(() => Promise.resolve()),
  updateCharacterConditionMeterValue: vi.fn(() => Promise.resolve()),
  updateCharacterMomentum: vi.fn(() => Promise.resolve()),
  updateCharacterImpactValue: vi.fn(() => Promise.resolve()),
  updateSpecialTrackValue: vi.fn(() => Promise.resolve()),
  updateExperience: vi.fn(() => Promise.resolve()),
  updateCharacterInitiativeStatus: vi.fn(() => Promise.resolve()),
};
const updateGameConditionMeter = vi.fn(() => Promise.resolve());

const initialCharacters = useGameCharactersStore.getState();
const initialGame = useGameStore.getState();
const initialTree = useDataswornTreeStore.getState();
const initialUsers = useUsersStore.getState();

function impact(label: string) {
  return { label } as unknown as Datasworn.ImpactRule;
}

function setCharacter(changes: Partial<ICharacter> = {}) {
  useGameCharactersStore.setState({
    ...updates,
    characters: {
      kira: {
        id: "kira",
        uid: "me",
        gameId: "game",
        name: "Kira",
        stats: { edge: 2, heart: 1 },
        conditionMeters: { health: 4 },
        momentum: 3,
        adds: 0,
        debilities: {},
        specialTracks: { quests_legacy: { value: 4, completed: false } },
        unspentExperience: 2,
        initiativeStatus: InitiativeStatus.OutOfCombat,
        editPermissions: CharacterEditPermissions.OnlyOwner,
        ...changes,
      } as unknown as ICharacter,
    },
  });
}

beforeEach(() => {
  session.uid = "me";
  useDataswornTreeStore.setState((state) => {
    state.activeRules = {};
    state.statRules = {
      edge: { label: "edge" },
      heart: { label: "heart" },
    } as unknown as Record<string, Datasworn.StatRule>;
    state.conditionMeterRules = {
      health: { label: "health", value: 5, min: 0, max: 5, shared: false },
      supply: { label: "supply", value: 5, min: 0, max: 5, shared: true },
    } as unknown as Record<string, Datasworn.ConditionMeterRule>;
    state.impactRules = {
      impactCategories: {
        misfortunes: {
          label: "misfortunes",
          contents: { wounded: impact("wounded"), shaken: impact("shaken") },
        },
        burdens: {
          label: "burdens",
          contents: { cursed: impact("cursed") },
        },
      } as unknown as Record<string, Datasworn.ImpactCategory>,
      impacts: {
        wounded: impact("wounded"),
        shaken: impact("shaken"),
        cursed: impact("cursed"),
      },
    };
    state.specialTrackRules = {
      quests_legacy: { label: "quests", optional: false },
      bonds_legacy: { label: "bonds", optional: false },
    } as unknown as Record<string, Datasworn.SpecialTrackRule>;
  });
  useGameStore.setState({
    gamePermissions: GamePermission.Player,
    game: { id: "game", gameType: GameType.Coop, conditionMeters: {} },
    updateConditionMeter: updateGameConditionMeter,
  } as unknown as Partial<ReturnType<typeof useGameStore.getState>>);
  useUsersStore.setState({
    users: { me: { loading: false, user: { name: "Ada" } } },
    loadUserDetails: vi.fn(),
  } as unknown as Partial<ReturnType<typeof useUsersStore.getState>>);
  setCharacter();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  useGameCharactersStore.setState(initialCharacters, true);
  useGameStore.setState(initialGame, true);
  useDataswornTreeStore.setState(initialTree, true);
  useUsersStore.setState(initialUsers, true);
  useMenuState.setState({ isCharacterEditAccessDialogOpen: false });
});

function renderSection(element: React.ReactElement) {
  return render(<MemoryRouter>{element}</MemoryRouter>, {
    wrapper: TestWrapper,
  });
}

/** Someone the sheet is not shared with. */
function asViewer() {
  session.uid = "someone-else";
}

describe("the character's header", () => {
  it("names the character and changes initiative from its chip", async () => {
    const user = userEvent.setup();
    renderSection(<CharacterDetails />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Kira" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /out of combat/i }));
    await user.click(
      await screen.findByRole("menuitemradio", { name: /has initiative/i }),
    );
    expect(updates.updateCharacterInitiativeStatus).toHaveBeenCalledWith(
      "kira",
      InitiativeStatus.HasInitiative,
    );
  });

  it("shows initiative without a menu to a viewer", () => {
    asViewer();
    renderSection(<CharacterDetails />);

    expect(screen.getByText("Out of Combat")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /out of combat/i }),
    ).not.toBeInTheDocument();
  });

  it("tells a player who shared the sheet with them", () => {
    session.uid = "bram";
    setCharacter({ editPermissions: CharacterEditPermissions.AllPlayers });
    renderSection(<CharacterDetails />);

    expect(screen.getByText("Shared by Ada")).toBeInTheDocument();
  });

  it("reminds the owner who else can edit, and opens the sharing dialog", async () => {
    const user = userEvent.setup();
    setCharacter({ editPermissions: CharacterEditPermissions.AllPlayers });
    renderSection(<CharacterDetails />);

    await user.click(
      screen.getByRole("button", { name: "All Players Can Edit" }),
    );
    expect(useMenuState.getState().isCharacterEditAccessDialogOpen).toBe(true);
  });

  it("says nothing about sharing in a solo game", () => {
    useGameStore.setState({
      game: { id: "game", gameType: GameType.Solo, conditionMeters: {} },
    } as unknown as Partial<ReturnType<typeof useGameStore.getState>>);
    setCharacter({ editPermissions: CharacterEditPermissions.AllPlayers });
    renderSection(<CharacterDetails />);

    expect(screen.queryByText(/can edit/i)).not.toBeInTheDocument();
  });
});

describe("stats", () => {
  it("rolls a stat with the character's adds and momentum", async () => {
    const user = userEvent.setup();
    setCharacter({ adds: 1 });
    renderSection(<Stats />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Stats" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^roll edge, \+2/i }));
    expect(rollStat).toHaveBeenCalledWith({
      statId: "edge",
      statLabel: "edge",
      statModifier: 2,
      adds: 1,
      momentum: 3,
    });
  });

  it("saves adds from its steppers", async () => {
    const user = userEvent.setup();
    renderSection(<Stats />);

    await user.click(screen.getByRole("button", { name: /add 1 to adds/i }));
    expect(updates.updateCharacterAdds).toHaveBeenCalledWith("kira", 1);
  });

  it("offers a viewer no rolls and no steppers", () => {
    asViewer();
    renderSection(<Stats />);

    expect(screen.getByText("Edge")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /roll edge/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add 1 to adds/i }),
    ).not.toBeInTheDocument();
  });
});

describe("meters", () => {
  it("saves a character meter, and a shared one to the game", async () => {
    const user = userEvent.setup();
    const { unmount } = renderSection(<ConditionMeters />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Meters" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /subtract 1 from health/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /subtract 1 from supply/i }),
    );
    // Steps are saved after a pause, or when the sheet closes.
    unmount();
    expect(updates.updateCharacterConditionMeterValue).toHaveBeenCalledWith(
      "kira",
      "health",
      3,
    );
    expect(updateGameConditionMeter).toHaveBeenCalledWith("game", "supply", 4);
  });

  it("rolls a meter at its current value", async () => {
    const user = userEvent.setup();
    renderSection(<ConditionMeters />);

    await user.click(
      screen.getByRole("button", { name: /^roll health, \+4/i }),
    );
    expect(rollStat).toHaveBeenCalledWith({
      statId: "health",
      statLabel: "health",
      statModifier: 4,
      momentum: 3,
      moveId: undefined,
      adds: 0,
    });
  });

  it("resets momentum to its reset value from its menu", async () => {
    const user = userEvent.setup();
    const { unmount } = renderSection(<ConditionMeters />);

    await user.click(
      screen.getByRole("button", { name: /^momentum \+3, reset/i }),
    );
    await user.click(await screen.findByRole("menuitem", { name: /reset/i }));
    unmount();
    expect(updates.updateCharacterMomentum).toHaveBeenCalledWith("kira", 2);
  });

  it("lowers the momentum max and reset for each marked impact", async () => {
    const user = userEvent.setup();
    setCharacter({ momentum: 9, debilities: { wounded: true } });
    const { unmount } = renderSection(<ConditionMeters />);

    const increase = screen.getByRole("button", {
      name: /add 1 to momentum/i,
    });
    expect(increase).toHaveAttribute("data-disabled");
    await user.click(
      screen.getByRole("button", { name: /^momentum \+9, reset/i }),
    );
    await user.click(await screen.findByRole("menuitem", { name: /reset/i }));
    unmount();
    expect(updates.updateCharacterMomentum).toHaveBeenCalledWith("kira", 1);
  });

  // A marked impact after an unmarked one still lowers the max and reset.
  it("counts every marked impact, not just the first ones", async () => {
    const user = userEvent.setup();
    setCharacter({
      momentum: 7,
      debilities: { wounded: false, shaken: true, cursed: true },
    });
    const { unmount } = renderSection(<ConditionMeters />);

    expect(
      screen.getByRole("button", { name: /add 1 to momentum/i }),
    ).not.toHaveAttribute("data-disabled");
    await user.click(
      screen.getByRole("button", { name: /^momentum \+7, reset/i }),
    );
    await user.click(await screen.findByRole("menuitem", { name: /reset/i }));
    unmount();
    expect(updates.updateCharacterMomentum).toHaveBeenCalledWith("kira", 0);
  });

  it("calls momentum Focus in Elegy", () => {
    useDataswornTreeStore.setState((state) => {
      state.activeRules = {
        [elegyRulesetConfig.id]: {} as Datasworn.RulesPackage,
      };
    });
    renderSection(<ConditionMeters />);

    expect(screen.getByRole("group", { name: "Focus" })).toBeInTheDocument();
  });

  it("offers a viewer no rolls and no steppers", () => {
    asViewer();
    renderSection(<ConditionMeters />);

    expect(
      screen.queryByRole("button", { name: /roll health/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /subtract 1 from health/i }),
    ).not.toBeInTheDocument();
  });
});

describe("impacts", () => {
  it("lists marked impacts, or None", () => {
    const { unmount } = renderSection(<ImpactsSection />);
    expect(screen.getByText("None")).toBeInTheDocument();
    unmount();

    setCharacter({ debilities: { wounded: true, cursed: true } });
    renderSection(<ImpactsSection />);
    expect(
      screen.getByRole("heading", { level: 3, name: "Impacts" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/wounded/i)).toBeInTheDocument();
    expect(screen.getByText(/cursed/i)).toBeInTheDocument();
  });

  it("marks an impact from the Edit dialog, which Done closes", async () => {
    const user = userEvent.setup();
    renderSection(<ImpactsSection />);

    await user.click(screen.getByRole("button", { name: "Edit Impacts" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit Impacts" });
    await user.click(within(dialog).getByText("Shaken"));
    expect(updates.updateCharacterImpactValue).toHaveBeenCalledWith(
      "kira",
      "shaken",
      true,
    );
    await user.click(within(dialog).getByRole("button", { name: "Done" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Edit Impacts" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("says Debilities in Ironsworn", () => {
    useDataswornTreeStore.setState((state) => {
      state.activeRules = {
        [ironswornRulesetConfig.id]: {} as Datasworn.RulesPackage,
      };
    });
    renderSection(<ImpactsSection />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Debilities" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit Debilities" }),
    ).toBeInTheDocument();
  });

  it("offers a viewer no Edit button", () => {
    asViewer();
    renderSection(<ImpactsSection />);

    expect(
      screen.queryByRole("button", { name: "Edit Impacts" }),
    ).not.toBeInTheDocument();
  });
});

describe("legacy tracks", () => {
  it("shows each legacy track and saves a step", async () => {
    const user = userEvent.setup();
    const { unmount } = renderSection(<LegacyTracks />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Legacy Tracks" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
    await user.click(
      screen.getByRole("button", { name: /mark progress on quests/i }),
    );
    unmount();
    expect(updates.updateSpecialTrackValue).toHaveBeenCalledWith(
      "kira",
      "quests_legacy",
      5,
    );
  });

  it("calls them Special Tracks when any is not a legacy", () => {
    useDataswornTreeStore.setState((state) => {
      state.specialTrackRules = {
        quests_legacy: { label: "quests", optional: false },
        notoriety: { label: "notoriety", optional: false },
      } as unknown as Record<string, Datasworn.SpecialTrackRule>;
    });
    renderSection(<LegacyTracks />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Special Tracks" }),
    ).toBeInTheDocument();
  });

  it("offers a viewer no steppers", () => {
    asViewer();
    renderSection(<LegacyTracks />);

    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: /mark progress on quests/i }),
    ).not.toBeInTheDocument();
  });
});

describe("experience", () => {
  it("saves unspent experience", async () => {
    const user = userEvent.setup();
    const { unmount } = renderSection(<ExperienceSection />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Experience" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /add 1 to unspent experience/i }),
    );
    unmount();
    expect(updates.updateExperience).toHaveBeenCalledWith("kira", 3);
  });
});
