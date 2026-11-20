/**
 * Story-only: the widths the responsive game page stories step through,
 * so the toolbar's viewports, or resizing the window, walk a page from
 * desktop down to the phone. `useGamePageTier` says which layout a width
 * gets.
 */
const viewport = (name: string, width: number, height: number) => ({
  name,
  styles: { width: `${width}px`, height: `${height}px` },
  type: width < 900 ? "mobile" : width < 1200 ? "tablet" : "desktop",
});

/** From the widest desktop down to a phone, each tier at its edges. */
export const responsiveViewports = {
  r1600: viewport("1600 x 900 (wide)", 1600, 900),
  r1440: viewport("1440 x 900 (wide)", 1440, 900),
  r1280: viewport("1280 x 800 (wide)", 1280, 800),
  r1200: viewport("1200 x 800 (wide, its narrowest)", 1200, 800),
  r1100: viewport("1100 x 800 (medium)", 1100, 800),
  r1024: viewport("1024 x 768 (medium)", 1024, 768),
  r900: viewport("900 x 1000 (medium, its narrowest)", 900, 1000),
  r820: viewport("820 x 1180 (phone layout, tablet)", 820, 1180),
  r600: viewport("600 x 960 (phone layout)", 600, 960),
  r390: viewport("390 x 844 (phone)", 390, 844),
};

export type ResponsiveViewport = keyof typeof responsiveViewports;
