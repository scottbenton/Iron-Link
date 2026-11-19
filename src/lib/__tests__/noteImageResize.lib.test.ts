import { describe, expect, it } from "vitest";

import {
  MIN_NOTE_IMAGE_WIDTH,
  getDraggedNoteImageWidth,
  getKeyboardNoteImageWidth,
  getNoteImageResizeEdge,
  getNoteImageWidthPercent,
  getStoredNoteImageWidth,
} from "../noteImageResize.lib";

describe("getNoteImageResizeEdge", () => {
  it("puts the handle on the edge that moves", () => {
    expect(getNoteImageResizeEdge("left")).toBe("right");
    expect(getNoteImageResizeEdge("center")).toBe("right");
    expect(getNoteImageResizeEdge("right")).toBe("left");
  });
});

describe("getDraggedNoteImageWidth", () => {
  const base = { startWidth: 300, columnWidth: 600 };

  it("grows a left aligned image as the right edge moves right", () => {
    expect(
      getDraggedNoteImageWidth({ ...base, deltaX: 50, alignment: "left" }),
    ).toBe(350);
  });

  it("grows a right aligned image as its left edge moves left", () => {
    expect(
      getDraggedNoteImageWidth({ ...base, deltaX: -50, alignment: "right" }),
    ).toBe(350);
    expect(
      getDraggedNoteImageWidth({ ...base, deltaX: 50, alignment: "right" }),
    ).toBe(250);
  });

  it("grows a centred image on both sides", () => {
    expect(
      getDraggedNoteImageWidth({ ...base, deltaX: 50, alignment: "center" }),
    ).toBe(400);
  });

  it("keeps the width between the minimum and the column", () => {
    expect(
      getDraggedNoteImageWidth({ ...base, deltaX: 900, alignment: "left" }),
    ).toBe(600);
    expect(
      getDraggedNoteImageWidth({ ...base, deltaX: -900, alignment: "left" }),
    ).toBe(MIN_NOTE_IMAGE_WIDTH);
  });
});

describe("getKeyboardNoteImageWidth", () => {
  it("steps by a share of the column with the arrows", () => {
    expect(getKeyboardNoteImageWidth("ArrowRight", 300, 600)).toBe(330);
    expect(getKeyboardNoteImageWidth("ArrowUp", 300, 600)).toBe(330);
    expect(getKeyboardNoteImageWidth("ArrowLeft", 300, 600)).toBe(270);
    expect(getKeyboardNoteImageWidth("PageUp", 300, 600)).toBe(420);
  });

  it("goes to the limits with Home and End", () => {
    expect(getKeyboardNoteImageWidth("Home", 300, 600)).toBe(
      MIN_NOTE_IMAGE_WIDTH,
    );
    expect(getKeyboardNoteImageWidth("End", 300, 600)).toBe(600);
    expect(getKeyboardNoteImageWidth("ArrowRight", 590, 600)).toBe(600);
  });

  it("ignores other keys", () => {
    expect(getKeyboardNoteImageWidth("Enter", 300, 600)).toBeUndefined();
  });
});

describe("getStoredNoteImageWidth", () => {
  it("stores no width for an image as wide as its column", () => {
    expect(getStoredNoteImageWidth(600, 600)).toBeNull();
    expect(getStoredNoteImageWidth(300, 600)).toBe(300);
  });
});

describe("getNoteImageWidthPercent", () => {
  it("reads the width as a share of the column", () => {
    expect(getNoteImageWidthPercent(300, 600)).toBe(50);
    expect(getNoteImageWidthPercent(900, 600)).toBe(100);
  });
});
