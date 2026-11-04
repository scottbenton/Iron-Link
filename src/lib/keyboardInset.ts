// What the keyboard inset is computed from: the layout viewport's height and
// the visual viewport's box within it.
export interface KeyboardInsetInput {
  // The height of the box `position: fixed` elements are laid out against,
  // read from a fixed probe filling it. An on-screen keyboard does not shrink
  // it in mobile Safari or current Chrome. Not `innerHeight`, which Firefox on
  // Android reports without its dynamic toolbar.
  layoutHeight: number;
  // `visualViewport.height`: what is left visible above the keyboard.
  visualHeight: number;
  // `visualViewport.offsetTop`: how far the visual viewport sits below the
  // layout viewport's top. iOS scrolls the layout viewport up to keep a
  // focused field in view, which moves the visible area without changing its
  // height.
  visualOffsetTop: number;
}

// How far the bottom of the visible area sits above the bottom of the fixed
// layout box, in whole CSS pixels: the height of an on-screen keyboard, or 0
// with none. Something fixed to that box's bottom sits on the keyboard once it
// is raised by this much.
//
// Counting the offset keeps a bar on the keyboard while iOS scrolls the layout
// viewport: the visible area's bottom edge is its offset plus its height,
// wherever the scroll put it.
export function computeKeyboardInset(input: KeyboardInsetInput): number {
  const { layoutHeight, visualHeight, visualOffsetTop } = input;
  return Math.max(
    0,
    Math.round(layoutHeight - (visualHeight + visualOffsetTop)),
  );
}
