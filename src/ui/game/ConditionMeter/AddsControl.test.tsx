import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AnnouncerProvider } from "../../components/Announcer";
import { AddsControl } from "./AddsControl";

function renderAdds(value: number) {
  const onChange = vi.fn();
  const announce = vi.fn();
  render(
    <AnnouncerProvider announce={announce}>
      <AddsControl value={value} onChange={onChange} />
    </AnnouncerProvider>,
  );
  return { onChange, announce };
}

describe("AddsControl", () => {
  it("names the group with its value and describes it with the hint", () => {
    renderAdds(2);
    const group = screen.getByRole("group", { name: "Adds +2" });
    expect(group).toHaveAccessibleDescription("Added to your next action roll");
  });

  it("explains adds in a popover from the help button", async () => {
    renderAdds(0);
    await userEvent.click(screen.getByRole("button", { name: "About Adds" }));
    const popover = await screen.findByRole("dialog", { name: "Adds" });
    expect(popover).toHaveAccessibleDescription(
      "Added to your next action roll",
    );
  });

  it("drops the help button without a hint", () => {
    render(<AddsControl value={0} onChange={vi.fn()} hint={null} />);
    expect(
      screen.queryByRole("button", { name: "About Adds" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("group")).not.toHaveAttribute("aria-describedby");
  });

  it("steps by one and announces the new value", async () => {
    const { onChange, announce } = renderAdds(-1);
    await userEvent.click(
      screen.getByRole("button", { name: "Add 1 to Adds" }),
    );
    expect(onChange).toHaveBeenCalledWith(0);
    expect(announce).toHaveBeenCalledWith("Adds is now 0");
  });

  it("stops at the limits", async () => {
    const { onChange } = renderAdds(9);
    const add = screen.getByRole("button", { name: "Add 1 to Adds" });
    expect(add).toHaveAttribute("data-disabled");
    await userEvent.click(add);
    expect(onChange).not.toHaveBeenCalled();
  });
});
