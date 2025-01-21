import { Datasworn } from "@datasworn/core";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MockedFunction, beforeEach, describe, expect, it, vi } from "vitest";

import { useRollStatAndAddToLog } from "pages/games/hooks/useRollStatAndAddToLog";

import { TestWrapper } from "tests/TestWrapper";

import { AssetControl, AssetControlProps } from "../AssetControl";

const mockRollStat = vi.fn();
const mockUseRollStat = useRollStatAndAddToLog as MockedFunction<
  typeof useRollStatAndAddToLog
>;
mockUseRollStat.mockImplementation(() => mockRollStat);

vi.mock("pages/games/hooks/useRollStatAndAddToLog", () => ({
  useRollStatAndAddToLog: vi.fn(),
}));
describe("AssetControl", () => {
  const setup = (props?: Partial<AssetControlProps>) => {
    const defaultProps: AssetControlProps = {
      controlId: "test-control-id",
      control: {
        field_type: "text",
        label: "Test Label",
      } as Datasworn.TextField,
      value: undefined,
      onControlChange: vi.fn(),
      ...props,
    };

    render(<AssetControl {...defaultProps} />, {
      wrapper: TestWrapper,
    });

    return {
      onControlChange: defaultProps.onControlChange,
    };
  };

  beforeEach(() => {
    mockRollStat.mockReset();
  });

  it("should render AssetSelectEnhancementField for select_enhancement type", () => {
    setup({
      control: {
        field_type: "select_enhancement",
        label: "Select Enhancement",
        value: null,
        choices: {
          option1: { label: "option1", choice_type: "choice" },
          option2: { label: "option2", choice_type: "choice" },
        },
      } as Datasworn.SelectEnhancementField,
    });
    expect(screen.getByLabelText("Select Enhancement")).toBeInTheDocument();
  });

  it("should render AssetCheckboxField for card_flip type", () => {
    setup({
      control: {
        field_type: "card_flip",
        label: "Card Flip",
      } as Datasworn.AssetControlField,
    });
    expect(screen.getByLabelText("Card Flip")).toBeInTheDocument();
  });

  it("should render AssetCheckboxField for checkbox type", () => {
    setup({
      control: {
        field_type: "checkbox",
        label: "Checkbox",
      } as Datasworn.AssetControlField,
    });
    expect(screen.getByLabelText("Checkbox")).toBeInTheDocument();
  });

  it("should render ConditionMeter for condition_meter type", () => {
    setup({
      control: {
        field_type: "condition_meter",
        label: "Condition Meter",
        value: 5,
        min: 0,
        max: 10,
      } as Datasworn.AssetControlField,
    });
    expect(screen.getByText("Condition Meter")).toBeInTheDocument();
  });

  it("should roll the condition meter if condition_meter is rollable", () => {
    setup({
      control: {
        field_type: "condition_meter",
        label: "Condition Meter",
        value: 5,
        min: 0,
        max: 10,
        rollable: true,
        // I would add a test case for the negative, but datasworn has this hardcoded as true currently.
      } as Datasworn.AssetControlField,
    });
    expect(mockRollStat).toHaveBeenCalledTimes(0);
    const rollButton = screen.getByTestId("roll-button");
    expect(rollButton).toBeInTheDocument();
    fireEvent.click(rollButton);
    expect(mockRollStat).toHaveBeenCalledTimes(1);
  });

  it("should render AssetTextField for text type", () => {
    setup({
      control: {
        field_type: "text",
        label: "Text Field",
      } as Datasworn.TextField,
    });
    expect(screen.getByLabelText("Text Field")).toBeInTheDocument();
  });

  it("should render AssetClockField for clock type", () => {
    setup({
      control: {
        field_type: "clock",
        label: "Clock Field",
        min: 0,
        max: 4,
        value: 0,
      } as Datasworn.ClockField,
    });
    expect(screen.getByText("Clock Field")).toBeInTheDocument();
  });

  it("should render AssetCounterField for counter type", () => {
    setup({
      control: {
        field_type: "counter",
        label: "Counter Field",
        min: 0,
        max: 0,
        value: 0,
      } as Datasworn.CounterField,
    });
    expect(screen.getByText("Counter Field")).toBeInTheDocument();
  });

  it("should call onControlChange for select_enhancement type", async () => {
    const { onControlChange } = setup({
      control: {
        field_type: "select_enhancement",
        label: "Select Enhancement",
        value: null,
        choices: {
          option1: { label: "option1", choice_type: "choice" },
          option2: { label: "option2", choice_type: "choice" },
        },
      } as Datasworn.SelectEnhancementField,
    });

    const select = screen.getByLabelText("Select Enhancement");
    fireEvent.mouseDown(select);

    const listBox = within(screen.getByRole("listbox"));
    const option = listBox.getByText("Option1");
    fireEvent.click(option);
    expect(onControlChange).toHaveBeenCalledWith("test-control-id", "option1");
  });

  it("should call onControlChange for card_flip type", async () => {
    const { onControlChange } = setup({
      control: {
        field_type: "card_flip",
        label: "Card Flip",
      } as Datasworn.AssetControlField,
    });
    fireEvent.click(screen.getByLabelText("Card Flip"));
    expect(onControlChange).toHaveBeenCalledWith("test-control-id", true);
  });

  it("should call onControlChange for checkbox type", async () => {
    const { onControlChange } = setup({
      control: {
        field_type: "checkbox",
        label: "Checkbox",
      } as Datasworn.AssetControlField,
    });
    fireEvent.click(screen.getByLabelText("Checkbox"));
    expect(onControlChange).toHaveBeenCalledWith("test-control-id", true);
  });

  it("should call onControlChange for condition_meter type", async () => {
    const { onControlChange } = setup({
      control: {
        field_type: "condition_meter",
        label: "Condition Meter",
        value: 5,
        min: 0,
        max: 10,
      } as Datasworn.AssetControlField,
    });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    await new Promise((r) => setTimeout(r, 300)); // Assuming debounce time
    expect(onControlChange).toHaveBeenCalledWith("test-control-id", 6);
  });

  it("should call onControlChange for text type", async () => {
    const { onControlChange } = setup({
      control: {
        field_type: "text",
        label: "Text Field",
        value: null,
      } as Datasworn.TextField,
    });
    const textField = screen.getByLabelText("Text Field");
    fireEvent.change(textField, { target: { value: "New Value" } });
    expect(onControlChange).toHaveBeenCalledWith(
      "test-control-id",
      "New Value",
    );
  });

  it("should call onControlChange for clock type", async () => {
    const { onControlChange } = setup({
      control: {
        field_type: "clock",
        label: "Clock Field",
        min: 0,
        max: 4,
        rollable: false,
      } as Datasworn.ClockField,
    });
    fireEvent.click(screen.getByRole("button", { name: /clock/i }));
    await new Promise((r) => setTimeout(r, 3000)); // Assuming debounce time

    expect(onControlChange).toHaveBeenCalledWith("test-control-id", 1);
  });

  it("should call onControlChange for counter type", async () => {
    const { onControlChange } = setup({
      control: {
        field_type: "counter",
        label: "Counter Field",
        min: 0,
        max: 999,
        rollable: false,
        value: 0,
      } as Datasworn.CounterField,
      value: 0,
    });
    const incrementButton = screen.getByRole("button", { name: /add/i });
    fireEvent.click(incrementButton);
    await new Promise((r) => setTimeout(r, 300)); // Assuming debounce time
    expect(onControlChange).toHaveBeenCalledWith("test-control-id", 1);
  });
});
