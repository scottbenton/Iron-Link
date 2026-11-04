import { Editor } from "@tiptap/react";
import { RefObject, useEffect, useRef, useState } from "react";

// A menu the bar opened. MUI portals menus to the body, and the bar's menu
// buttons don't mark themselves expanded, so an open one is found by where
// focus is.
const BAR_MENU_SELECTOR = ".MuiPopover-root, .MuiMenu-root";
// A button in the bar whose popup is open, for popups that don't take focus.
const OPEN_POPUP_TRIGGER_SELECTOR = '[aria-expanded="true"]';

function editorHasFocus(editor: Editor, active: Element | null): boolean {
  if (editor.isDestroyed) return false;
  // Tiptap sets this on the editor's own focus event, which fires before the
  // focusin this is read from.
  if (editor.isFocused) return true;
  // Focus on a control inside the text.
  return active !== null && editor.view.dom.contains(active);
}

// Whether focus is somewhere the bar belongs to right now.
function isEditing(editor: Editor, bar: HTMLElement | null): boolean {
  const active = document.activeElement;
  if (editorHasFocus(editor, active)) return true;
  if (active?.closest(BAR_MENU_SELECTOR)) return true;
  if (!bar) return false;
  if (active && bar.contains(active)) return true;
  return bar.querySelector(OPEN_POPUP_TRIGGER_SELECTOR) !== null;
}

// Whether a phone toolbar that shows only while editing shows: while focus is
// in the editor, in the bar, or in a menu the bar opened, and never
// otherwise, so it never covers a page that is only being read. `editor` is
// the one the toolbar acts on, which changes as the caret moves into and out
// of a secret block.
//
// Listens at the document because menus portal out of the bar. Showing is
// immediate, on the focus that calls for it; hiding waits one frame and
// checks again, because focus moving from the editor into the bar arrives as
// a focusout with nothing focused yet, and hiding on that would flicker.
export function useKeyboardToolbarVisibility(
  editor: Editor,
  bar: RefObject<HTMLElement | null>,
): boolean {
  const [editing, setEditing] = useState(() => editor.isFocused);

  // Read when checking, so a check started before the caret moved into or
  // out of a secret block asks the editor that has it now.
  const editorRef = useRef(editor);
  editorRef.current = editor;

  useEffect(() => {
    let frame = 0;

    function cancel() {
      if (frame === 0) return;
      cancelAnimationFrame(frame);
      frame = 0;
    }

    function checkNextFrame() {
      cancel();
      frame = requestAnimationFrame(() => {
        frame = 0;
        setEditing(isEditing(editorRef.current, bar.current));
      });
    }

    function onFocusIn() {
      if (isEditing(editorRef.current, bar.current)) {
        cancel();
        setEditing(true);
        return;
      }
      checkNextFrame();
    }

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", checkNextFrame);
    return () => {
      cancel();
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", checkNextFrame);
    };
  }, [bar]);

  return editing;
}
