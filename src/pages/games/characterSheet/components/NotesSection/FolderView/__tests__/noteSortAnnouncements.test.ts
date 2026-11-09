import type { Active, Over } from "@dnd-kit/core";
import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import { getNoteSortAccessibility } from "../noteSortAnnouncements";

// Fills in the default text the way i18next does.
const t = ((
  _key: string,
  defaultValue: string,
  options?: Record<string, unknown>,
) =>
  defaultValue.replace(/\{\{(\w+)\}\}/g, (_, name) =>
    String(options?.[name]),
  )) as unknown as TFunction;

const titles: Record<string, string> = {
  "0b8c3a52-uuid": "Session one",
  "7f1e9d04-uuid": "Session two",
  "c2d4e6f8-uuid": "Session three",
};
const ids = Object.keys(titles);
const { announcements, screenReaderInstructions } = getNoteSortAccessibility(
  t,
  ids,
  (id) => titles[id],
);
const active = { id: ids[0] } as Active;
const over = { id: ids[2] } as Over;

describe("getNoteSortAccessibility", () => {
  it("names the note by title and position, never by id", () => {
    expect(announcements.onDragStart({ active })).toBe(
      "Picked up Session one, at position 1 of 3.",
    );
    expect(announcements.onDragOver({ active, over })).toBe(
      "Session one is at position 3 of 3.",
    );
    expect(announcements.onDragEnd({ active, over })).toBe(
      "Session one moved to position 3 of 3.",
    );
    expect(announcements.onDragCancel({ active, over: null })).toBe(
      "Moving Session one canceled.",
    );
  });

  it("says a drop outside the list was canceled", () => {
    expect(announcements.onDragEnd({ active, over: null })).toBe(
      "Moving Session one canceled.",
    );
  });

  it("gives its own instructions", () => {
    expect(screenReaderInstructions.draggable).toMatch(/^To move this note/);
  });
});
