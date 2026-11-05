import ExampleIcon from "@mui/icons-material/Casino";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAppState } from "stores/appState.store";

import { TestWrapper } from "tests/TestWrapper";

import { ConditionMeter, ConditionMeterProps } from "../ConditionMeter";

describe("ConditionMeter", () => {
  const setup = (props?: Partial<ConditionMeterProps>) => {
    const conditionMeterProps = {
      label: "Test Label",
      defaultValue: 5,
      min: 0,
      max: 10,
      ...props,
    };

    // Render the ConditionMeter component with the provided props
    render(<ConditionMeter {...conditionMeterProps} />, {
      wrapper: TestWrapper,
    });
  };

  it("should render the label", () => {
    setup();
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });
  it("should render the default value if an explicit value is not provided", () => {
    setup();
    expect(screen.getByText("+5")).toBeInTheDocument();
  });
  it("should render the increment and decrement buttons when onChange is provided", () => {
    setup({ onChange: () => {} });
    expect(
      screen.getByRole("button", { name: /subtract/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
  });

  it("should disable the increment and decrement buttons when onChange is not provided", () => {
    setup();
    expect(screen.getByRole("button", { name: /subtract/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /add/i })).toBeDisabled();
  });

  it("should call onChange with the correct value when increment button is clicked", () => {
    const handleChange = vi.fn();
    setup({ onChange: handleChange });
    screen.getByRole("button", { name: /add/i }).click();
    expect(handleChange).toHaveBeenCalledWith(6);
  });

  it("should call onChange with the correct value when decrement button is clicked", () => {
    const handleChange = vi.fn();
    setup({ onChange: handleChange });
    screen.getByRole("button", { name: /subtract/i }).click();
    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it("should disable the decrement button when the value is at the minimum", () => {
    setup({ value: 0, onChange: () => {} });
    expect(screen.getByRole("button", { name: /subtract/i })).toBeDisabled();
  });

  it("should disable the increment button when the value is at the maximum", () => {
    setup({ value: 10, onChange: () => {} });
    expect(screen.getByRole("button", { name: /add/i })).toBeDisabled();
  });

  it("should render the ActionIcon when provided", () => {
    setup({ action: { ActionIcon: ExampleIcon, actionLabel: "Test Action" } });
    expect(screen.getByTestId("Test LabelTest Action")).toBeInTheDocument();
  });

  it("should name the action button with the action, label and value", () => {
    setup({
      value: 3,
      onActionClick: () => {},
      action: { ActionIcon: ExampleIcon, actionLabel: "Reset" },
    });
    // Named by its action and value, not the meter's name alone.
    expect(
      screen.getByRole("button", { name: "Reset Test Label, +3" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("group")).toHaveAccessibleName("Test Label");
  });

  it("should render a negative value with a single minus sign", () => {
    setup({ value: -2, min: -9, onActionClick: () => {} });
    expect(screen.getByText("-2")).toBeInTheDocument();
    expect(screen.queryByText("--2")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Test Label, -2" }),
    ).toBeInTheDocument();
  });

  it("should not render the value as a heading", () => {
    setup();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("should announce the new value after a change", () => {
    setup({ onChange: () => {} });
    const before = useAppState.getState().announcementId;
    screen.getByRole("button", { name: /add/i }).click();
    expect(useAppState.getState().announcementId).toBe(before + 1);
    expect(useAppState.getState().announcement).toBe("Test Label is now +6");
  });

  it("should call onActionClick when the action button is clicked", () => {
    const handleActionClick = vi.fn();
    setup({ onActionClick: handleActionClick });
    screen.getByText("+5").click();
    expect(handleActionClick).toHaveBeenCalled();
  });
});
