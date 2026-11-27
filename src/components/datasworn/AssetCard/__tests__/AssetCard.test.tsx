/**
 * The asset card as players use it, read through roles and names so it
 * holds on the MUI card and on the library one (migration slice 11): the
 * name and requirement, abilities that tick, the name option, the health
 * meter with its roll and its Out of Action box, and what a reader without
 * edit rights can do.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MockedFunction,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { useRollStatAndAddToLog } from "pages/games/hooks/useRollStatAndAddToLog";

import { TestWrapper } from "tests/TestWrapper";
import { RULESETS, loadRules } from "tests/datasworn/rulesets";

import { IAsset } from "services/asset.service";

import { AssetCard, AssetCardProps } from "../AssetCard";

vi.mock("pages/games/hooks/useRollStatAndAddToLog", () => ({
  useRollStatAndAddToLog: vi.fn(),
}));
const mockRoll = vi.fn();
(
  useRollStatAndAddToLog as MockedFunction<typeof useRollStatAndAddToLog>
).mockImplementation(() => mockRoll);

const PROTOCOL_BOT = "asset:starforged/companion/protocol_bot";
const STARSHIP = "asset:starforged/command_vehicle/starship";

const FIRST_ABILITY = /^Your protocol bot companion is programmed/;
const SECOND_ABILITY = /^When you first visit or interact/;

function document(overrides?: Partial<IAsset>): IAsset {
  return {
    id: "asset-1",
    dataswornAssetId: PROTOCOL_BOT,
    order: 1,
    characterId: "character-1",
    gameId: null,
    enabledAbilities: {},
    controlValues: { health: 2 },
    optionValues: {},
    ...overrides,
  } as IAsset;
}

function renderCard(props?: Partial<AssetCardProps>) {
  return render(<AssetCard assetId={PROTOCOL_BOT} {...props} />, {
    wrapper: TestWrapper,
  });
}

function editableProps() {
  return {
    assetDocument: document(),
    onAssetAbilityToggle: vi.fn(),
    onAssetOptionChange: vi.fn(),
    onAssetControlChange: vi.fn(),
  };
}

function isLocked(element: HTMLElement) {
  return (
    element.matches(":disabled, [readonly], [aria-disabled='true']") ||
    element.getAttribute("aria-readonly") === "true"
  );
}

describe("AssetCard", () => {
  beforeAll(() => {
    loadRules(RULESETS.starforged.slice(0, 1));
    // jsdom has no PointerEvent, which Base UI's checkbox dispatches.
    globalThis.PointerEvent ??= class extends MouseEvent {} as never;
  });

  beforeEach(() => {
    mockRoll.mockReset();
  });

  it("names the asset in a heading under its category, with its abilities", () => {
    renderCard();
    expect(
      screen.getByRole("heading", { name: "Protocol Bot", level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Companion")).toBeInTheDocument();
    // Each ability is a checkbox named by its own text.
    expect(
      screen.getAllByRole("checkbox", { name: /./ }).length,
    ).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole("checkbox", { name: FIRST_ABILITY })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: SECOND_ABILITY }),
    ).not.toBeChecked();
  });

  it("ticks an ability, but never the one that comes switched on", async () => {
    const user = userEvent.setup();
    const props = editableProps();
    renderCard(props);

    await user.click(screen.getByRole("checkbox", { name: SECOND_ABILITY }));
    expect(props.onAssetAbilityToggle).toHaveBeenCalledWith(1, true);

    expect(
      isLocked(screen.getByRole("checkbox", { name: FIRST_ABILITY })),
    ).toBe(true);
  });

  it("shows only the ticked abilities while unchecked ones are hidden", () => {
    renderCard({
      assetDocument: document({ enabledAbilities: { 2: true } }),
      hideUnavailableAbilities: true,
    });
    expect(
      screen.getByRole("checkbox", { name: FIRST_ABILITY }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: SECOND_ABILITY }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /^If you make a move/ }),
    ).toBeChecked();
  });

  it("saves the companion's name as it is typed", async () => {
    const user = userEvent.setup();
    const props = editableProps();
    renderCard({
      ...props,
      assetDocument: document({ optionValues: { name: "Ro" } }),
    });
    const name = screen.getByRole("textbox", { name: "Name" });
    expect(name).toHaveValue("Ro");
    await user.type(name, "ok");
    expect(props.onAssetOptionChange).toHaveBeenLastCalledWith("name", "Rook");
  });

  it("steps the health meter from its saved value", async () => {
    const user = userEvent.setup();
    const props = editableProps();
    renderCard(props);
    expect(
      screen.getByRole("group", { name: /^health$/i }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /^add 1 to health$/i }),
    );
    await waitFor(() =>
      expect(props.onAssetControlChange).toHaveBeenCalledWith("health", 3),
    );
  });

  it("rolls the health meter with its saved value", async () => {
    const user = userEvent.setup();
    renderCard(editableProps());
    await user.click(screen.getByRole("button", { name: /^roll health/i }));
    expect(mockRoll).toHaveBeenCalledTimes(1);
    expect(mockRoll).toHaveBeenCalledWith(
      expect.objectContaining({ statId: "health", statModifier: 2 }),
    );
  });

  it("marks the companion out of action", async () => {
    const user = userEvent.setup();
    const props = editableProps();
    renderCard(props);
    expect(
      screen.getByRole("checkbox", { name: /^out of action$/i }),
    ).not.toBeChecked();
    await user.click(screen.getByText(/^out of action$/i));
    expect(props.onAssetControlChange).toHaveBeenCalledWith(
      "out_of_action",
      true,
    );
  });

  it("lets a reader without edit rights read but not change anything", () => {
    renderCard({ assetDocument: document() });
    expect(isLocked(screen.getByRole("textbox", { name: "Name" }))).toBe(true);
    expect(
      isLocked(screen.getByRole("checkbox", { name: SECOND_ABILITY })),
    ).toBe(true);
    // The steppers are gone or disabled; the roll is gone.
    const add = screen.queryByRole("button", { name: /^add 1 to health$/i });
    expect(add === null || isLocked(add)).toBe(true);
    expect(
      screen.queryByRole("button", { name: /^roll health/i }),
    ).not.toBeInTheDocument();
  });

  it("marks a shared asset when asked to", () => {
    const { unmount } = render(
      <AssetCard assetId={STARSHIP} showSharedIcon />,
      { wrapper: TestWrapper },
    );
    expect(
      screen.getByRole("heading", { name: "Starship" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^shared/i)).toBeInTheDocument();
    unmount();

    render(<AssetCard assetId={STARSHIP} />, { wrapper: TestWrapper });
    expect(screen.queryByLabelText(/^shared/i)).not.toBeInTheDocument();
  });

  it("shows its header and footer actions", () => {
    renderCard({
      headerActions: <button type="button">Remove</button>,
      actions: <button type="button">Choose</button>,
    });
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose" })).toBeInTheDocument();
  });

  it("says so when the asset is not in the loaded rules", () => {
    renderCard({ assetId: "asset:starforged/companion/missing" });
    expect(
      screen.getByText(/asset:starforged\/companion\/missing/),
    ).toBeInTheDocument();
  });
});
