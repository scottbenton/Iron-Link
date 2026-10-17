import { Box } from "@mui/material";
import { PropsWithChildren, useEffect, useRef } from "react";

const MOBILE_KEYBOARD_TOOLBAR_HEIGHT = 41;

export interface MobileKeyboardToolbarProps extends PropsWithChildren {
  // Kept mounted while hidden so it stays positioned.
  hidden?: boolean;
}

// A toolbar fixed to the bottom of the visual viewport, so on a phone it
// rides just above the keyboard. Notes and world entry Notes share it.
export function MobileKeyboardToolbar(props: MobileKeyboardToolbarProps) {
  const { hidden, children } = props;

  const toolbar = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resizeHandler = () => {
      const tb = toolbar.current;
      const vp = viewport.current;

      const wvp = window.visualViewport;
      if (tb && vp && wvp) {
        // Since the bar is position: fixed we need to offset it by the visual
        // viewport's offset from the layout viewport origin.
        const offsetLeft = viewport.current?.offsetLeft ?? 0;
        const offsetTop =
          wvp.height - vp.getBoundingClientRect().height + wvp.offsetTop;

        // You could also do this by setting style.left and style.top if you
        // use width: 100% instead.
        tb.style.transform = `translate(${offsetLeft}px, ${offsetTop}px) scale(${
          1 / wvp.scale
        })`;
        tb.style.display = "flex";
      }
    };

    // run first time to initialize
    resizeHandler();

    // subscribe to events which affect scroll, or viewport position
    window.visualViewport?.addEventListener("resize", resizeHandler);
    window.visualViewport?.addEventListener("scroll", resizeHandler);
    window?.addEventListener("touchmove", resizeHandler);

    // unsubscribe
    return () => {
      window.visualViewport?.removeEventListener("resize", resizeHandler);
      window.visualViewport?.removeEventListener("scroll", resizeHandler);
      window?.removeEventListener("touchmove", resizeHandler);
    };
  }, []);

  return (
    <>
      <Box
        height={MOBILE_KEYBOARD_TOOLBAR_HEIGHT}
        bgcolor={(theme) =>
          theme.palette.mode === "light" ? "background.paper" : "grey.700"
        }
        borderTop={(theme) => `1px solid ${theme.palette.divider}`}
        ref={toolbar}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        px={2}
        gap={0.5}
        overflow="auto"
        display={"none"} // This will be updated above once computation is done
        visibility={hidden ? "hidden" : undefined}
        zIndex={(theme) => theme.zIndex.appBar - 1}
      >
        {children}
      </Box>
      <Box
        ref={viewport}
        left={0}
        position="fixed"
        width="100%"
        height="100%"
        visibility={"hidden"}
      />
    </>
  );
}
