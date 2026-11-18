import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AnnouncerProvider } from "../../components/Announcer";
import { Clock, ClockProps } from "./Clock";
import { advanceClock } from "./clockValue";

function renderClock(props: Partial<ClockProps> = {}) {
  const onChange = vi.fn();
  const announce = vi.fn();
  const view = render(
    <AnnouncerProvider announce={announce}>
      <Clock
        label="The archive floods"
        segments={6}
        value={2}
        onChange={onChange}
        {...props}
      />
    </AnnouncerProvider>,
  );
  return { ...view, onChange, announce };
}

describe("advanceClock", () => {
  it("adds one segment until the clock is full", () => {
    expect(advanceClock(0, 4)).toBe(1);
    expect(advanceClock(5, 6)).toBe(6);
    expect(advanceClock(6, 6)).toBeNull();
    expect(advanceClock(9, 6)).toBeNull();
  });
});

describe("Clock", () => {
  it("advances by one from its centre and announces the new count", async () => {
    const user = userEvent.setup();
    const { onChange, announce } = renderClock();
    await user.click(
      screen.getByRole("button", { name: "Advance The archive floods" }),
    );
    expect(onChange).toHaveBeenCalledExactlyOnceWith(3);
    expect(announce).toHaveBeenCalledWith(
      "The archive floods, 3 of 6 segments filled",
    );
  });

  it("does nothing from its centre once full", async () => {
    const user = userEvent.setup();
    const { onChange } = renderClock({ value: 6 });
    const centre = screen.getByRole("button", {
      name: "Advance The archive floods",
    });
    expect(centre).toHaveAttribute("aria-disabled", "true");
    await user.click(centre);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("still sets the value from a segment", async () => {
    const user = userEvent.setup();
    const { container, onChange } = renderClock();
    const segments = container.querySelectorAll("[data-hit]");
    await user.click(segments[4]);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(5);
  });

  it("has no centre when read-only, disabled or a bar", () => {
    renderClock({ onChange: undefined });
    renderClock({ disabled: true });
    renderClock({ variant: "bar" });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("names the slider by the card's title", () => {
    renderClock({ presentation: "card", typeLabel: "Tension Clock" });
    expect(
      screen.getByRole("slider", { name: "The archive floods" }),
    ).toHaveAttribute("aria-valuetext", "2 of 6 segments filled");
  });
});
