import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import {
  CSSProperties,
  ComponentProps,
  FormEvent,
  ReactNode,
  useMemo,
  useState,
} from "react";

import { css, cva, cx } from "styled-system/css";

import { LiveRegion } from "../Announcer";
import { isPressOnToasts } from "../Toast/toastViewport";
import { DialogContext, DialogContextValue } from "./dialogContext";

export const dialogBackdropStyles = css({
  position: "fixed",
  inset: 0,
  zIndex: "dialog",
  background: "backdrop",
  transition: "opacity token(durations.normal) linear",
  _startingStyle: { opacity: 0 },
  _endingStyle: { opacity: 0, transitionDuration: "fast" },
});

export const dialogPopupStyles = cva({
  base: {
    position: "fixed",
    zIndex: "dialog",
    top: "50%",
    left: "50%",
    translate: "-50% -50%",
    display: "flex",
    flexDirection: "column",
    width: "min(var(--dialog-width), calc(100vw - 32px))",
    maxHeight: "calc(100dvh - 48px)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.control",
    borderRadius: "xl",
    background: "bg.surface",
    color: "fg.default",
    fontFamily: "body",
    boxShadow: "dialog",
    outline: "none",
    transitionProperty: "opacity, translate, scale",
    transitionDuration: "normal",
    transitionTimingFunction: "out",
    _startingStyle: {
      opacity: 0,
      translate: "-50% calc(-50% + 10px)",
      scale: "0.98",
    },
    _endingStyle: {
      opacity: 0,
      translate: "-50% calc(-50% + 10px)",
      scale: "0.98",
      transitionDuration: "fast",
      transitionTimingFunction: "in",
    },
    _reducedMotion: {
      _startingStyle: { translate: "-50% -50%", scale: "1" },
      _endingStyle: { translate: "-50% -50%", scale: "1" },
    },
  },
  variants: {
    size: {
      xs: { "--dialog-width": "360px" },
      sm: { "--dialog-width": "440px" },
      md: { "--dialog-width": "600px" },
      lg: { "--dialog-width": "860px" },
      xl: { "--dialog-width": "1140px" },
    },
    /** Fills the screen on phones, like MUI's fullScreen at the sm breakpoint. */
    fullScreenOnMobile: {
      true: {
        smDown: {
          top: 0,
          left: 0,
          translate: "0 0",
          width: "100vw",
          height: "100dvh",
          maxHeight: "100dvh",
          borderRadius: 0,
          border: 0,
          boxShadow: "none",
          _startingStyle: { translate: "0 24px", scale: "1" },
          _endingStyle: { translate: "0 24px", scale: "1" },
        },
      },
    },
  },
  defaultVariants: { size: "sm" },
});

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * The widest the dialog grows, in place of `size`'s width, such as
   * `"960px"` or `960` (pixels). It still keeps a margin on small screens.
   */
  maxWidth?: string | number;
  fullScreenOnMobile?: boolean;
  /**
   * Makes the dialog a form, so Enter in a field submits it. Give the main
   * action `type="submit"`. The handler gets the event with default
   * already prevented.
   */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  className?: string;
  /** Element to focus on open; defaults to the first focusable. */
  initialFocus?: ComponentProps<typeof BaseDialog.Popup>["initialFocus"];
}

/**
 * A modal dialog. Compose it from DialogHeader, DialogBody and DialogActions.
 * Escape and a press outside close it; focus returns to the trigger.
 */
export function Dialog(props: DialogProps) {
  const {
    open,
    onClose,
    children,
    size,
    maxWidth,
    fullScreenOnMobile,
    onSubmit,
    className,
    initialFocus,
  } = props;

  const [message, setMessage] = useState<{ text: string; nonce: number }>({
    text: "",
    nonce: 0,
  });
  const context = useMemo<DialogContextValue>(
    () => ({
      announce: (text) =>
        setMessage((previous) => ({ text, nonce: previous.nonce + 1 })),
    }),
    [],
  );

  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={(nextOpen, details) => {
        // Toasts sit above modals; pressing one is not a press outside.
        if (!nextOpen && !isPressOnToasts(details)) onClose();
      }}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={dialogBackdropStyles} />
        <BaseDialog.Popup
          className={cx(
            "ui-root",
            dialogPopupStyles({ size, fullScreenOnMobile }),
            className,
          )}
          initialFocus={initialFocus}
          style={
            maxWidth === undefined
              ? undefined
              : ({
                  "--dialog-width":
                    typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
                } as CSSProperties)
          }
          render={
            onSubmit ? (
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  onSubmit(event);
                }}
              />
            ) : undefined
          }
        >
          <DialogContext.Provider value={context}>
            {children}
          </DialogContext.Provider>
          <LiveRegion message={message.text || null} nonce={message.nonce} />
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
