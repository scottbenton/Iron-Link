import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TestWrapper } from "tests/TestWrapper";

import { ProgressTrack } from "../ProgressTrack";

describe("ProgressTrack", () => {
  it("is named by its label and reads boxes and ticks", () => {
    render(<ProgressTrack label="Find the relic" value={14} />, {
      wrapper: TestWrapper,
    });
    const track = screen.getByRole("progressbar", { name: "Find the relic" });
    expect(track).toHaveAttribute(
      "aria-valuetext",
      "3 of 10 boxes filled, and 2 of 4 ticks",
    );
  });

  it("leaves out ticks when every filled box is full", () => {
    render(<ProgressTrack label="Find the relic" value={8} />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "2 of 10 boxes filled",
    );
  });
});
