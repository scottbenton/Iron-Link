import { CSSProperties, useLayoutEffect, useRef } from "react";
import { Toaster as SonnerToaster, useSonner } from "sonner";

import { css } from "styled-system/css";

import { useAnnounce } from "../Announcer";
import { Button } from "../Button";
import { toast } from "./toast";
import { subscribeToToastAnnouncements } from "./toastAnnouncements";

const BASE_OFFSET = "calc(20px + env(safe-area-inset-bottom, 0px))";
const FOOTER_SPACE = 44;

const toasterStyles = css({
  // Above dialogs and drawers, below tooltips. Sonner's own value is huge.
  zIndex: "toast!",
});

/** Classes on each toast's `li`; the look is ToastCard's. */
const toastItemStyles = css({
  width: "100%",
  borderRadius: "md",
  _focusVisible: { boxShadow: "0 0 0 2px token(colors.focusRing)!" },
  // Toasts past the visible cap fade out; hide them from Tab too.
  "&[data-visible=false]": {
    visibility: "hidden",
    transition:
      "transform 0.4s, opacity 0.4s, height 0.4s, visibility 0s linear 0.4s!",
    _reducedMotion: { transition: "none!" },
  },
});

const footerStyles = css({
  position: "fixed",
  zIndex: "toast",
  left: "50%",
  bottom: BASE_OFFSET,
  translate: "-50% 0",
  display: "flex",
  alignItems: "center",
  gap: "1",
  minHeight: "36px",
  paddingInlineStart: "3",
  paddingInlineEnd: "1",
  borderRadius: "full",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "gray.700",
  background: "gray.800",
  color: "gray.200",
  fontFamily: "body",
  fontSize: "xs",
  whiteSpace: "nowrap",
  "& button": {
    "--btn-fg": "{colors.gray.50}",
    "--btn-hover": "color-mix(in oklab, white 12%, transparent)",
    "--btn-press": "color-mix(in oklab, white 20%, transparent)",
    minHeight: "28px",
    borderRadius: "full",
    _focusVisible: { outlineColor: "gray.50" },
  },
});

export interface ToasterProps {
  /** How many toasts show at once; older ones wait behind "N more". */
  visibleToasts?: number;
  /** Names the notifications region. */
  label?: string;
  clearAllLabel?: string;
  /** The count of hidden toasts, such as "2 more". */
  moreLabel?: (count: number) => string;
}

/**
 * Where toasts render, newest at the bottom. UIProvider mounts it once.
 * Show toasts with `toast.*` or `useToast()`.
 */
export function Toaster(props: ToasterProps) {
  const {
    visibleToasts = 3,
    label = "Notifications",
    clearAllLabel = "Clear All",
    moreLabel = (count) => `${count} more`,
  } = props;

  const announce = useAnnounce();
  useLayoutEffect(() => subscribeToToastAnnouncements(announce), [announce]);

  // Toasts are announced through the library's announcer, so Sonner's region
  // must not read them a second time.
  const regionRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    region.setAttribute("aria-live", "off");
    region.removeAttribute("aria-relevant");
    region.removeAttribute("aria-atomic");
  });

  const { toasts } = useSonner();
  const count = toasts.filter((item) => !item.delete).length;
  const hidden = Math.max(0, count - visibleToasts);
  const showFooter = count > 1;
  const bottom = showFooter
    ? `calc(${BASE_OFFSET} + ${FOOTER_SPACE}px)`
    : BASE_OFFSET;

  return (
    <>
      <SonnerToaster
        ref={regionRef}
        position="bottom-center"
        duration={Infinity}
        expand
        visibleToasts={visibleToasts}
        gap={8}
        customAriaLabel={label}
        className={toasterStyles}
        style={{ "--width": "400px" } as CSSProperties}
        offset={{ bottom }}
        mobileOffset={{ bottom, left: 16, right: 16 }}
        toastOptions={{ unstyled: true, className: toastItemStyles }}
      />
      {showFooter && (
        <div className={`ui-root ${footerStyles}`}>
          {hidden > 0 && <span>{moreLabel(hidden)}</span>}
          <Button variant="ghost" size="sm" onClick={() => toast.dismissAll()}>
            {clearAllLabel}
          </Button>
        </div>
      )}
    </>
  );
}
