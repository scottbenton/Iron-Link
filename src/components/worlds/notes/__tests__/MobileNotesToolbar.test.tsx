import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ToolbarClearanceContext } from "components/RichTextEditor/toolbarClearance";

import {
  KEYBOARD_INSET_PROBE_CLASS,
  KEYBOARD_INSET_SETTLE_MS,
} from "hooks/useKeyboardInset";

import { MobileNotesToolbar } from "../MobileNotesToolbar";

// jsdom lays nothing out; ProseMirror asks for rects when it scrolls.
const noRects = Object.assign([], {
  item: () => null,
}) as unknown as DOMRectList;
Range.prototype.getClientRects = () => noRects;
Range.prototype.getBoundingClientRect = () => new DOMRect();
Element.prototype.getClientRects = () => noRects;

// The bar, a child of the body, measures this tall,
// and the probe the keyboard inset is read from fills an 844px window.
const BAR_HEIGHT = 41;
const WINDOW_HEIGHT = 844;
const originalRect = HTMLElement.prototype.getBoundingClientRect;

class FakeVisualViewport extends EventTarget {
  height = WINDOW_HEIGHT;
  offsetTop = 0;
}
let viewport: FakeVisualViewport;

let editor: Editor | undefined;

beforeEach(() => {
  vi.useFakeTimers();
  viewport = new FakeVisualViewport();
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: viewport,
  });
  HTMLElement.prototype.getBoundingClientRect = function boundingRect() {
    if (this.classList.contains(KEYBOARD_INSET_PROBE_CLASS)) {
      return { width: 0, height: WINDOW_HEIGHT } as DOMRect;
    }
    if (this.parentElement === document.body) {
      return { width: 390, height: BAR_HEIGHT } as DOMRect;
    }
    return originalRect.call(this);
  };
});

afterEach(() => {
  editor?.destroy();
  editor = undefined;
  vi.useRealTimers();
  HTMLElement.prototype.getBoundingClientRect = originalRect;
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: undefined,
  });
});

function renderToolbar() {
  editor = new Editor({ extensions: [StarterKit], content: "<p>Notes</p>" });
  const current = editor;
  const setClearance = vi.fn();
  const view = render(
    <ToolbarClearanceContext.Provider value={setClearance}>
      <button type="button">Elsewhere</button>
      <div className="MuiPopover-root">
        <button type="button">Menu item</button>
      </div>
      <MobileNotesToolbar editor={current}>
        <button
          type="button"
          onClick={() => current.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
      </MobileNotesToolbar>
      <EditorContent editor={current} />
    </ToolbarClearanceContext.Provider>,
  );
  return { ...view, editor: current, setClearance };
}

function bar() {
  // By its text: hidden, the button has no accessible name.
  const button = screen.getByText("Bold");
  const element = [...document.body.children].find(
    (child) => child.contains(button) && !child.contains(editor!.view.dom),
  );
  if (!(element instanceof HTMLElement)) throw new Error("no bar");
  return element;
}

function nextFrame() {
  act(() => {
    vi.advanceTimersToNextFrame();
  });
}

function openKeyboard(height: number) {
  viewport.height = WINDOW_HEIGHT - height;
  viewport.dispatchEvent(new Event("resize"));
  nextFrame();
}

describe("MobileNotesToolbar", () => {
  it("sits on the body, outside the page", () => {
    const { container } = renderToolbar();
    expect(container).not.toContainElement(bar());
  });

  it("shows while the editor has focus and hides a frame after it leaves", () => {
    const { editor } = renderToolbar();
    expect(bar()).not.toBeVisible();

    act(() => editor.view.dom.focus());
    // Showing is immediate, with no frame's wait.
    expect(bar()).toBeVisible();

    act(() => screen.getByRole("button", { name: "Elsewhere" }).focus());
    // Hiding waits a frame, in case focus is only moving into the bar.
    expect(bar()).toBeVisible();
    nextFrame();
    expect(bar()).not.toBeVisible();
  });

  it("stays up while a menu it opened has focus", () => {
    const { editor } = renderToolbar();
    act(() => editor.view.dom.focus());
    act(() => screen.getByRole("button", { name: "Menu item" }).focus());
    nextFrame();
    expect(bar()).toBeVisible();
  });

  it("keeps a button press from taking focus out of the editor", async () => {
    // userEvent waits between steps on real timers.
    vi.useRealTimers();
    const user = userEvent.setup();
    const { editor } = renderToolbar();
    act(() => editor.view.dom.focus());

    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(editor.view.dom).toHaveFocus();
    expect(editor.isActive("bold")).toBe(true);
  });

  it("reports its clearance only while it shows", () => {
    const { editor, setClearance, unmount } = renderToolbar();
    expect(setClearance).toHaveBeenLastCalledWith(0);

    act(() => editor.view.dom.focus());
    expect(setClearance).toHaveBeenLastCalledWith(BAR_HEIGHT);

    unmount();
    expect(setClearance).toHaveBeenLastCalledWith(0);
  });

  it("follows the keyboard at once and adds it to its clearance once it settles", () => {
    const { editor, setClearance } = renderToolbar();
    act(() => editor.view.dom.focus());
    expect(bar()).not.toHaveAttribute("data-keyboard-open");

    openKeyboard(200);
    expect(bar().style.transform).toBe("translateY(-200px)");
    openKeyboard(336);
    expect(bar().style.transform).toBe("translateY(-336px)");
    expect(bar()).toHaveAttribute("data-keyboard-open");
    expect(setClearance).toHaveBeenLastCalledWith(BAR_HEIGHT);

    act(() => {
      vi.advanceTimersByTime(KEYBOARD_INSET_SETTLE_MS);
    });
    expect(setClearance).toHaveBeenLastCalledWith(BAR_HEIGHT + 336);
    const reported = setClearance.mock.calls.map(([value]) => value);
    expect(reported).not.toContain(BAR_HEIGHT + 200);

    openKeyboard(0);
    expect(bar().style.transform).toBe("");
    expect(bar()).not.toHaveAttribute("data-keyboard-open");
  });
});
