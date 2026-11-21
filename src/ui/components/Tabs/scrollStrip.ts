import { css } from "styled-system/css";

/**
 * A horizontal strip that scrolls without a scrollbar and fades its edges
 * while there is more to see on that side. Pair it with `useScrollFade`,
 * which writes `data-overflow-start` and `data-overflow-end`.
 */
export const scrollStripStyles = css({
  "--fade-start": "0px",
  "--fade-end": "0px",
  overflowX: "auto",
  overflowY: "hidden",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
  maskImage:
    "linear-gradient(to right, transparent 0, black var(--fade-start), black calc(100% - var(--fade-end)), transparent 100%)",
  "&[data-overflow-start]": { "--fade-start": "24px" },
  "&[data-overflow-end]": { "--fade-end": "24px" },
});
