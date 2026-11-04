import { Box, SxProps, Theme } from "@mui/material";
import { PropsWithChildren, useLayoutEffect, useRef, useState } from "react";

// How far in from an edge the fade reaches.
const FADE_WIDTH = 24;

interface Overflow {
  start: boolean;
  end: boolean;
}

// Scrolled within a pixel of an edge counts as at it: scroll positions can
// be fractional while widths are whole.
function readOverflow(scroller: HTMLElement): Overflow {
  const { scrollLeft, scrollWidth, clientWidth } = scroller;
  return {
    start: scrollLeft > 1,
    end: scrollLeft + clientWidth < scrollWidth - 1,
  };
}

// Opaque where the row shows, clear at an edge with more of it that way.
function getFadeMask({ start, end }: Overflow): string {
  if (!start && !end) return "none";
  const from = start ? `transparent, #000 ${FADE_WIDTH}px` : "#000";
  const to = end ? `#000 calc(100% - ${FADE_WIDTH}px), transparent` : "#000";
  return `linear-gradient(to right, ${from}, ${to})`;
}

export interface ScrollFadeRowProps extends PropsWithChildren {
  // Styles for the row of children, a flex row filling the scroller.
  sx?: SxProps<Theme>;
}

// A row that scrolls sideways when it doesn't fit, and fades out at an edge
// while more of it lies beyond that edge. The fade is a mask on the scroller,
// so it works over any background and never takes a tap.
export function ScrollFadeRow(props: ScrollFadeRowProps) {
  const { sx, children } = props;

  const scroller = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState<Overflow>({
    start: false,
    end: false,
  });

  // Checked when the row is scrolled, and when the scroller or the row
  // changes size: the window resizing, or buttons coming and going.
  useLayoutEffect(() => {
    const scrollerElement = scroller.current;
    const rowElement = row.current;
    if (!scrollerElement || !rowElement) return;

    const update = () => {
      const next = readOverflow(scrollerElement);
      setOverflow((current) =>
        current.start === next.start && current.end === next.end
          ? current
          : next,
      );
    };
    update();

    scrollerElement.addEventListener("scroll", update, { passive: true });
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(update);
      observer.observe(scrollerElement);
      observer.observe(rowElement);
    }
    return () => {
      scrollerElement.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, []);

  const mask = getFadeMask(overflow);

  return (
    <Box
      ref={scroller}
      sx={{
        display: "flex",
        overflowX: "auto",
        overflowY: "hidden",
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    >
      <Box
        ref={row}
        sx={[
          // As wide as the scroller, so a child can grow to its end. Its
          // children shrink as they would in a plain flex row, and it
          // overflows only once they can shrink no further.
          { display: "flex", flexGrow: 1 },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {children}
      </Box>
    </Box>
  );
}
