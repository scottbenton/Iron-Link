import { Datasworn } from "@datasworn-community/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IAsset } from "services/asset.service";

import { AssetAbilities } from "../AssetAbilities";

describe("AssetAbilities", () => {
  const mockAbilities: Datasworn.AssetAbility[] = [
    { _id: "1", name: "Ability 1", text: "Description 1", enabled: false },
    { _id: "2", name: "Ability 2", text: "Description 2", enabled: true },
    { _id: "3", name: "Ability 3", text: "Description 3", enabled: false },
  ];

  const mockAssetDocument: IAsset = {
    id: "1",
    enabledAbilities: {
      0: true,
      1: false,
      2: false,
    },
    order: 1,
    gameId: null,
    characterId: null,
    dataswornAssetId: "1",
    controlValues: {},
    optionValues: {},
  };

  it("renders correctly with given props", () => {
    render(<AssetAbilities abilities={mockAbilities} />);
    expect(screen.getByText("Ability 1:")).toBeInTheDocument();
    expect(screen.getByText("Ability 2:")).toBeInTheDocument();
    expect(screen.getByText("Description 1")).toBeInTheDocument();
    expect(screen.getByText("Description 2")).toBeInTheDocument();
  });

  it("checkboxes are checked/unchecked based on enabled property and assetDocument", () => {
    render(
      <AssetAbilities
        abilities={mockAbilities}
        assetDocument={mockAssetDocument}
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();
  });

  it("calls onAbilityToggle with correct parameters when checkbox is toggled", () => {
    const onAbilityToggle = vi.fn();
    render(
      <AssetAbilities
        abilities={mockAbilities}
        onAbilityToggle={onAbilityToggle}
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(onAbilityToggle).toHaveBeenCalledWith(0, true);
    fireEvent.click(checkboxes[1]);
    expect(onAbilityToggle).toHaveBeenCalledWith(1, false);
  });

  it("renders MarkdownRenderer with correct markdown text", () => {
    render(<AssetAbilities abilities={mockAbilities} />);
    expect(screen.getByText("Description 1")).toBeInTheDocument();
    expect(screen.getByText("Description 2")).toBeInTheDocument();
  });
});
