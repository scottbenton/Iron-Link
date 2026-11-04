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

// Where the visible area sits, as a bar fixed to the bottom of the layout box
// needs to know to stay on its bottom edge at its own size.
export interface VisibleArea {
  // See `computeKeyboardInset`. While pinch zoomed it also counts the part of
  // the layout box below the zoomed view.
  inset: number;
  // `visualViewport.offsetLeft`: how far a zoomed view is panned right.
  offsetLeft: number;
  // `visualViewport.scale`: the pinch zoom, 1 with none.
  scale: number;
}

export function isSameVisibleArea(a: VisibleArea, b: VisibleArea): boolean {
  return (
    a.inset === b.inset && a.offsetLeft === b.offsetLeft && a.scale === b.scale
  );
}

// The transform that puts a bar fixed to the bottom left of the layout box on
// the bottom edge of the visible area, as wide as it and at the bar's own
// size however far the page is pinch zoomed. The bar's transform origin must
// be its bottom left corner.
export function getBottomBarTransform(area: VisibleArea): string {
  const { inset, offsetLeft, scale } = area;
  if (scale === 1 && offsetLeft === 0) {
    return inset > 0 ? `translateY(${-inset}px)` : "";
  }
  return `translate(${offsetLeft}px, ${-inset}px) scale(${1 / scale})`;
}
