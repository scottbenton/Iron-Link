import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import SuggestionList, {
  type SuggestionListProps,
  type SuggestionListRef,
} from "../SuggestionList";
import type { MentionSuggestion } from "../otherNoteOptions";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

// jsdom has no layout, so scrolling a row into view does nothing.
Element.prototype.scrollIntoView ??= () => {};

const ITEMS: MentionSuggestion[] = [
  { id: "e1", mentionLabel: "Ashfall", kind: "worldEntry", group: "Places" },
  { id: "e2", mentionLabel: "Brannoc", kind: "worldEntry", group: "People" },
  { id: "n1", mentionLabel: "Session one", kind: "note", group: "Notes" },
];

function setup(items = ITEMS) {
  const command = vi.fn();
  const ref = createRef<SuggestionListRef>();
  const props = { items, command } as unknown as SuggestionListProps;
  const view = render(<SuggestionList ref={ref} {...props} />);
  const press = (key: string) => {
    let handled = false;
    act(() => {
      handled = ref.current!.onKeyDown({
        event: new KeyboardEvent("keydown", { key }),
      } as Parameters<SuggestionListRef["onKeyDown"]>[0]);
    });
    return handled;
  };
  return { ...view, command, press };
}

describe("SuggestionList", () => {
  it("lists every suggestion under its group's heading", () => {
    setup();
    for (const label of ["Places", "People", "Notes"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    for (const name of ["Ashfall", "Brannoc", "Session one"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("shows nothing when nothing matches", () => {
    const { container, press, command } = setup([]);
    expect(container).toBeEmptyDOMElement();
    expect(press("Enter")).toBe(true);
    expect(command).not.toHaveBeenCalled();
  });

  it("stores a world entry without its name, and a note with its title", () => {
    const { command } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Brannoc" }));
    expect(command).toHaveBeenLastCalledWith({
      id: "e2",
      label: null,
      kind: "worldEntry",
    });
    fireEvent.click(screen.getByRole("button", { name: "Session one" }));
    expect(command).toHaveBeenLastCalledWith({
      id: "n1",
      label: "Session one",
      kind: "note",
    });
  });

  it("moves with the arrow keys, wrapping at either end, and picks with Enter", () => {
    const { command, press } = setup();
    expect(press("ArrowDown")).toBe(true);
    expect(press("Enter")).toBe(true);
    expect(command).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "e2" }),
    );

    press("ArrowDown");
    press("ArrowDown");
    press("Enter");
    expect(command).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "e1" }),
    );

    press("ArrowUp");
    press("Enter");
    expect(command).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "n1" }),
    );
  });

  it("leaves other keys to the editor", () => {
    const { press } = setup();
    expect(press("a")).toBe(false);
    expect(press("Escape")).toBe(false);
  });

  it("starts from the first suggestion again when the list changes", () => {
    const { command, press, rerender } = setup();
    press("ArrowDown");
    const props = {
      items: [...ITEMS].reverse(),
      command,
    } as unknown as SuggestionListProps;
    const ref = createRef<SuggestionListRef>();
    rerender(<SuggestionList ref={ref} {...props} />);
    act(() => {
      ref.current!.onKeyDown({
        event: new KeyboardEvent("keydown", { key: "Enter" }),
      } as Parameters<SuggestionListRef["onKeyDown"]>[0]);
    });
    expect(command).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "n1" }),
    );
  });
});
