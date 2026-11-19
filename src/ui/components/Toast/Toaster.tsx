import { Broom } from "@phosphor-icons/react";
import {
  CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Toaster as SonnerToaster, useSonner } from "sonner";

import { css } from "styled-system/css";

import { useAnnounce } from "../Announcer";
import { Button } from "../Button";
import { toast } from "./toast";
import { subscribeToToastAnnouncements } from "./toastAnnouncements";

const BASE_OFFSET = "calc(20px + env(safe-area-inset-bottom, 0px))";
const FOOTER_SPACE = 48;

const toasterStyles = css({
  // Below dialogs and drawers (see the token). Sonner's own value is huge.
  zIndex: "toast!",
  // The stack rises to make room for Clear All when a second toast arrives.
  // Without this it jumped there while the new toast slid in, the hitch on
  // the second toast; it now moves with Sonner's own 400ms toast motion.
  transition: "bottom 400ms ease",
  _reducedMotion: { transition: "none" },
});

/**
 * Classes on each toast's `li`. The look is the card's (ToastCard, RollCard),
 * so a roll card can be a toast too; the `li` only holds it. Sonner puts a
 * custom toast inside `[data-content] > [data-title]`, so those two are
 * `display: contents` and the rules below reach the card itself.
 *
 * Collapsed, the newest toast is in front and each older one sits a clear
 * step (12px) above it, a little narrower, cut to the front toast's height
 * with its content hidden and its card a shade darker, so its top edge reads
 * as a card behind, border and corners included. Sonner positions and fans
 * out the stack, but its own peek is a chain of custom properties that left
 * the older toasts hidden behind the front one, so the collapsed transform is
 * set here outright (top origin, so each step shows exactly 12px). Hover, or
 * keyboard focus, fans the stack out with the gap between, and Sonner
 * animates between the two. A toast on its way out keeps Sonner's exit.
 */
const toastItemStyles = css({
  width: "100%",
  borderRadius: "lg",
  _focusVisible: { boxShadow: "0 0 0 2px token(colors.focusRing)!" },
  "& > [data-content], & > [data-content] > [data-title]": {
    display: "contents",
  },
  "&[data-expanded=false][data-front=false][data-removed=false]": {
    transform:
      "translateY(calc(var(--toasts-before) * -12px)) scale(calc(1 - var(--toasts-before) * 0.05))!",
    transformOrigin: "top center",
    // Never zero, even before Sonner has measured the front toast.
    minHeight: "52px",
  },
  "&[data-expanded=false][data-front=false] > [data-content] > [data-title] > *":
    {
      height: "100%",
      minHeight: 0,
      overflow: "hidden",
      background: "bg.muted",
    },
  "&[data-expanded=false][data-front=false][data-index='2'] > [data-content] > [data-title] > *":
    {
      background: "bg.emphasized",
    },
  "& > [data-content] > [data-title] > *, & > [data-content] > [data-title] > * > *":
    {
      transition:
        "opacity token(durations.normal) linear, background-color token(durations.normal) linear",
      _reducedMotion: { transition: "none" },
    },
  "&[data-expanded=false][data-front=false] > [data-content] > [data-title] > * > *":
    { opacity: 0 },
  // Toasts past the visible cap fade out; hide them from Tab too.
  "&[data-visible=false]": {
    visibility: "hidden",
    transition:
      "transform 0.4s, opacity 0.4s, height 0.4s, visibility 0s linear 0.4s!",
    _reducedMotion: { transition: "none!" },
  },
});

/**
 * Under the stack: Clear All as a pill button of its own (the whole pill is
 * the button), with the hidden count beside it as a quiet label pill. The
 * footer itself draws nothing, so the button's label centres in its pill.
 */
const footerStyles = css({
  position: "fixed",
  zIndex: "toast",
  left: "50%",
  bottom: BASE_OFFSET,
  translate: "-50% 0",
  display: "flex",
  alignItems: "center",
  gap: "2",
  whiteSpace: "nowrap",
  animation: "fadeIn token(durations.normal) ease-out",
  _reducedMotion: { animation: "none" },
  "& > [data-toast-clear-all]": {
    borderRadius: "full",
    "--ledge-radius": "token(radii.full)",
    paddingInline: "3",
    boxShadow: "popover",
  },
});

/** "2 more", a label pill beside Clear All. */
const moreStyles = css({
  display: "inline-flex",
  alignItems: "center",
  minHeight: "control.sm",
  paddingInline: "3",
  borderRadius: "full",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  background: "bg.surface",
  boxShadow: "popover",
  color: "fg.muted",
  fontFamily: "body",
  fontSize: "xs",
  fontWeight: "medium",
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
 * Whether focus is inside `ref`'s element. Removing the focused element
 * sends no focusout, so it is also re-read whenever the element's content
 * changes: a toast closed with its own Dismiss button leaves the page only
 * after its exit, well after `recheckKey` (the toast list) has moved on, and
 * until then the stack stayed fanned out.
 */
function useFocusWithin(
  ref: { current: HTMLElement | null },
  recheckKey: unknown,
) {
  const [focusWithin, setFocusWithin] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onFocusIn = () => setFocusWithin(true);
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && element.contains(next)) return;
      setFocusWithin(false);
    };
    const observer = new MutationObserver(() => {
      if (!element.contains(document.activeElement)) setFocusWithin(false);
    });
    element.addEventListener("focusin", onFocusIn);
    element.addEventListener("focusout", onFocusOut);
    observer.observe(element, { childList: true, subtree: true });
    return () => {
      element.removeEventListener("focusin", onFocusIn);
      element.removeEventListener("focusout", onFocusOut);
      observer.disconnect();
    };
  }, [ref]);
  useLayoutEffect(() => {
    const element = ref.current;
    setFocusWithin(!!element && element.contains(document.activeElement));
  }, [ref, recheckKey]);
  return focusWithin;
}

/**
 * Sonner collapses the fanned-out stack when the pointer leaves it, which
 * React reports from the element the pointer was last over. When that
 * element was a toast just dismissed (its close button), it is gone from the
 * page, the browser reports no leave, and the stack stayed fanned out until
 * the pointer went back in and out again. So while the stack is fanned out,
 * a pointer moving outside it reports the leave itself.
 */
function useCollapseAfterRemoval(ref: { current: HTMLElement | null }) {
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const list = ref.current?.querySelector("[data-sonner-toaster]");
      if (!list || !list.querySelector('[data-expanded="true"]')) return;
      if (event.target instanceof Node && list.contains(event.target)) return;
      list.dispatchEvent(
        new MouseEvent("mouseout", {
          bubbles: true,
          relatedTarget: document.body,
        }),
      );
    };
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => document.removeEventListener("pointermove", onPointerMove);
  }, [ref]);
}

/**
 * Where toasts render. They stack front to back, the newest in front and up
 * to `visibleToasts - 1` older ones peeking out behind it; hovering the
 * stack, or moving keyboard focus into it, fans them out. UIProvider mounts
 * it once. Show toasts with `toast.*` or `useToast()`.
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

  // Sonner fans the stack out on hover only. Keyboard focus inside it fans
  // it out too, so the toast or button that has focus is never hidden behind
  // the front one. Sonner's `expand` is that switch; left on, as it was, the
  // toasts never stack.
  const focusWithin = useFocusWithin(regionRef, toasts);
  useCollapseAfterRemoval(regionRef);
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
        expand={focusWithin}
        visibleToasts={visibleToasts}
        gap={14}
        customAriaLabel={label}
        className={toasterStyles}
        style={{ "--width": "400px" } as CSSProperties}
        offset={{ bottom }}
        mobileOffset={{ bottom, left: 16, right: 16 }}
        toastOptions={{ unstyled: true, className: toastItemStyles }}
      />
      {showFooter && (
        <div className={`ui-root ${footerStyles}`} data-toast-footer="">
          {hidden > 0 && (
            <span className={moreStyles}>{moreLabel(hidden)}</span>
          )}
          <Button
            variant="outline"
            size="sm"
            startIcon={<Broom weight="bold" />}
            data-toast-clear-all=""
            onClick={() => toast.dismissAll()}
          >
            {clearAllLabel}
          </Button>
        </div>
      )}
    </>
  );
}
