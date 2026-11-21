/**
 * Which fields and controls an asset card shows, app and library side by
 * side (migration slice 4): enabled abilities add controls and options and
 * enhance the asset's own, and both lists sort by label.
 */
import { Datasworn } from "@datasworn-community/core";
import { render, screen } from "@testing-library/react";
import { MockedFunction, beforeEach, describe, expect, it, vi } from "vitest";

import { getAssetFields, sortByLabel } from "ui/game/AssetCard/assetData";

import { useAsset } from "hooks/datasworn/useAsset";

import { TestWrapper } from "tests/TestWrapper";

import { IAsset } from "services/asset.service";

import { AssetCard } from "../AssetCard";
import { AssetControls, AssetControlsProps } from "../AssetControls";
import { AssetOptions, AssetOptionsProps } from "../AssetOptions";

vi.mock("hooks/datasworn/useAsset", () => ({ useAsset: vi.fn() }));
const mockUseAsset = useAsset as MockedFunction<typeof useAsset>;

// Each field reads out its key, so the order on screen is the order passed.
vi.mock("../AssetControl", () => ({
  AssetControl: (props: { controlId: string }) => (
    <span data-testid="control">{props.controlId}</span>
  ),
}));
vi.mock("../AssetOption", () => ({
  AssetOption: (props: { assetOptionKey: string }) => (
    <span data-testid="option">{props.assetOptionKey}</span>
  ),
}));
vi.mock("../AssetAbilities", () => ({ AssetAbilities: () => null }));
vi.mock("../AssetHeader", () => ({ AssetHeader: () => null }));
vi.mock("../AssetNameAndDescription", () => ({
  AssetNameAndDescription: () => null,
}));

const health = {
  field_type: "condition_meter",
  label: "health",
  value: 3,
  min: 0,
  max: 3,
  rollable: true,
  moves: {},
  controls: {},
} as unknown as Datasworn.AssetConditionMeterControlField;

const asset = {
  _id: "asset:starforged/companion/protocol_bot",
  name: "Protocol Bot",
  category: "Companion",
  options: {
    name: { field_type: "text", label: "name", value: null },
  },
  controls: { health },
  abilities: [
    { enabled: true, text: "First" },
    {
      enabled: false,
      text: "Second",
      controls: {
        charge: { field_type: "checkbox", label: "charged", value: false },
      },
      options: {
        alias: { field_type: "text", label: "alias", value: null },
      },
      enhance_asset: {
        controls: { health: { field_type: "condition_meter", max: 5 } },
      },
    },
    {
      enabled: false,
      text: "Third",
      enhance_asset: {
        // A different field type never enhances.
        controls: { health: { field_type: "checkbox", max: 9 } },
      },
      controls: {
        aim: { field_type: "checkbox", label: "Aimed", value: false },
      },
    },
  ],
} as unknown as Datasworn.Asset;

function assetDocument(enabledAbilities: Record<number, boolean>): IAsset {
  return {
    id: "asset-doc",
    characterId: null,
    gameId: null,
    controlValues: {},
    dataswornAssetId: asset._id,
    enabledAbilities,
    optionValues: {},
    order: 0,
  };
}

const states: [string, IAsset | undefined][] = [
  ["no document", undefined],
  ["no abilities ticked", assetDocument({})],
  ["the second ability ticked", assetDocument({ 1: true })],
  ["every ability ticked", assetDocument({ 1: true, 2: true })],
];

describe("AssetCard fields, app and library", () => {
  beforeEach(() => {
    mockUseAsset.mockReturnValue(asset);
  });

  it.each(states)("shows the same fields with %s", (_, document) => {
    render(<AssetCard assetId={asset._id} assetDocument={document} />, {
      wrapper: TestWrapper,
    });
    const { controls, options } = getAssetFields(asset, document);
    expect(
      screen.getAllByTestId("control").map((el) => el.textContent),
    ).toEqual(sortByLabel(controls).map(([key]) => key));
    expect(screen.getAllByTestId("option").map((el) => el.textContent)).toEqual(
      sortByLabel(options).map(([key]) => key),
    );
  });

  it("enhances a control only when the field types agree", () => {
    const { controls } = getAssetFields(
      asset,
      assetDocument({ 1: true, 2: true }),
    );
    expect(controls.health).toMatchObject({ max: 5 });
  });
});

describe("asset field order, app and library", () => {
  // Labels in both cases and an accented one, as Datasworn writes them.
  const fields = {
    b: { field_type: "checkbox", label: "broken", value: false },
    a: { field_type: "checkbox", label: "Aimed", value: false },
    e: { field_type: "checkbox", label: "Éclat", value: false },
    c: { field_type: "checkbox", label: "charged", value: false },
  } as unknown as AssetControlsProps["controls"] & AssetOptionsProps["options"];

  it("sorts controls and options by label alike", () => {
    const expected = sortByLabel(fields!).map(([key]) => key);
    render(
      <>
        <AssetControls controls={fields} />
        <AssetOptions options={fields!} />
      </>,
      { wrapper: TestWrapper },
    );
    expect(
      screen.getAllByTestId("control").map((el) => el.textContent),
    ).toEqual(expected);
    expect(screen.getAllByTestId("option").map((el) => el.textContent)).toEqual(
      expected,
    );
  });
});
