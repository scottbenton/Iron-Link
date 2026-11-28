import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TestWrapper } from "tests/TestWrapper";

import { SecretBlockView } from "../SecretBlockView";
import type { SecretsAudience } from "../useSecretsCompanion";

// jsdom lays nothing out; ProseMirror asks for rects when it scrolls.
const noRects = Object.assign([], {
  item: () => null,
}) as unknown as DOMRectList;
Range.prototype.getClientRects = () => noRects;
Range.prototype.getBoundingClientRect = () => new DOMRect();
Element.prototype.getClientRects = () => noRects;

let editor: Editor | undefined;
let widget: HTMLElement | undefined;

afterEach(() => {
  editor?.destroy();
  editor = undefined;
  widget?.remove();
  widget = undefined;
});

interface SetupOptions {
  sharedOnlyWith?: SecretsAudience | null;
  onDelete?: (id: string) => void;
  editable?: boolean;
}

function setup(options: SetupOptions = {}) {
  const { sharedOnlyWith = null, onDelete, editable = true } = options;
  editor = new Editor({
    extensions: [StarterKit],
    content: "<p>The duke is a ghost</p>",
    editable,
  });
  // The shared editor's widget, which the block draws into.
  widget = document.createElement("div");
  document.body.append(widget);
  const onMounted = vi.fn();
  render(
    <TestWrapper>
      <SecretBlockView
        block={{ id: "s1", dom: widget, editor }}
        sharedOnlyWith={sharedOnlyWith}
        onMounted={onMounted}
        onDelete={onDelete}
      />
    </TestWrapper>,
  );
  return { editor, widget, onMounted };
}

describe("SecretBlockView", () => {
  it("draws a labelled section into the block's widget, holding its text", () => {
    const { widget, onMounted } = setup();
    const section = screen.getByRole("region", { name: "Secret" });
    expect(widget).toContainElement(section);
    expect(within(section).getByText("The duke is a ghost")).toBeVisible();
    expect(onMounted).toHaveBeenCalledWith("s1");
  });

  it("says who can read it while players can't yet", () => {
    setup({ sharedOnlyWith: "you" });
    expect(screen.getByText(/Shared only with you so far/)).toBeInTheDocument();
  });

  it("says nothing more once players can read the surface", () => {
    setup();
    expect(screen.queryByText(/so far/)).not.toBeInTheDocument();
  });

  it("deletes the block where the Guide may edit", () => {
    const onDelete = vi.fn();
    setup({ onDelete });
    fireEvent.click(screen.getByRole("button", { name: "Delete secret" }));
    expect(onDelete).toHaveBeenCalledWith("s1");
  });

  it("offers no delete otherwise", () => {
    setup();
    expect(
      screen.queryByRole("button", { name: "Delete secret" }),
    ).not.toBeInTheDocument();
  });

  it("puts the caret in the block's text when its label is pressed", async () => {
    const { editor } = setup();
    const label = within(
      screen.getByRole("region", { name: "Secret" }),
    ).getByText("Secret");
    const press = fireEvent.mouseDown(label);
    expect(press).toBe(false);
    // Tiptap focuses on the next frame.
    await waitFor(() => expect(editor.isFocused).toBe(true));
  });
});
