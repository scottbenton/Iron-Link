import { Tabs } from "@mui/material";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TestWrapper } from "tests/TestWrapper";

import { NoteTab } from "../NoteTab";

function renderTabs(onClose = vi.fn(), onChange = vi.fn()) {
  render(
    <Tabs value="b" onChange={(_, value) => onChange(value)}>
      {["a", "b", "c"].map((id) => (
        <NoteTab
          key={id}
          value={id}
          id={`note-tab-${id}`}
          aria-controls={`note-tabpanel-${id}`}
          name={`Note ${id.toUpperCase()}`}
          onClose={() => onClose(id)}
        />
      ))}
    </Tabs>,
    { wrapper: TestWrapper },
  );
  return { onClose, onChange };
}

describe("NoteTab", () => {
  it("puts the close button beside the tab, not inside it", () => {
    renderTabs();
    const tab = screen.getByRole("tab", { name: "Note B" });
    expect(tab).toHaveAttribute("aria-selected", "true");
    const close = screen.getByRole("button", { name: "Close Note B" });
    expect(tab).not.toContainElement(close);
  });

  it("closes its item", async () => {
    const user = userEvent.setup();
    const { onClose, onChange } = renderTabs();
    await user.click(screen.getByRole("button", { name: "Close Note B" }));
    expect(onClose).toHaveBeenCalledWith("b");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves between tabs with the arrow keys, Home and End", async () => {
    const user = userEvent.setup();
    const { onChange } = renderTabs();
    screen.getByRole("tab", { name: "Note B" }).focus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Note C" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Note A" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Note C" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Note A" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("a");
  });
});
