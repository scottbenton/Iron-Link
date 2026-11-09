import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAppState } from "stores/appState.store";

import { TestWrapper } from "tests/TestWrapper";

import { ClockCircle } from "../ClockCircle";
import { DebouncedClockCircle } from "../DebouncedClockCircle";

describe("ClockCircle", () => {
  it("reads its name and value", () => {
    render(<ClockCircle label="Siege" segments={6} value={3} />, {
      wrapper: TestWrapper,
    });
    expect(
      screen.getByRole("img", { name: "Siege, 3 of 6 segments filled" }),
    ).toBeInTheDocument();
  });

  it("is hidden from screen readers without a name or action", () => {
    render(<ClockCircle segments={4} value={0} />, { wrapper: TestWrapper });
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("names its button by value and what pressing it does", () => {
    const { rerender } = render(
      <ClockCircle label="Siege" segments={6} value={3} onClick={() => {}} />,
      { wrapper: TestWrapper },
    );
    expect(
      screen.getByRole("button", {
        name: "Siege, 3 of 6 segments filled, fill a segment",
      }),
    ).toBeInTheDocument();
    rerender(
      <ClockCircle label="Siege" segments={6} value={6} onClick={() => {}} />,
    );
    expect(
      screen.getByRole("button", {
        name: "Siege, 6 of 6 segments filled, clear clock",
      }),
    ).toBeInTheDocument();
  });

  it("keeps focus on the clock when a segment is filled", () => {
    render(
      <DebouncedClockCircle
        voiceLabel="Siege"
        segments={4}
        value={1}
        onFilledSegmentsChange={vi.fn()}
      />,
      { wrapper: TestWrapper },
    );
    const button = screen.getByRole("button");
    button.focus();
    fireEvent.click(button);
    expect(screen.getByRole("button")).toBe(button);
    expect(button).toHaveFocus();
    expect(useAppState.getState().announcement).toBe(
      "Siege, 2 of 4 segments filled",
    );
  });
});
