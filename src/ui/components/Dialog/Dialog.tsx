import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "@phosphor-icons/react";
import {
  ComponentProps,
  FormEvent,
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import { css, cva, cx } from "styled-system/css";

import { LiveRegion } from "../Announcer";
import { IconButton } from "../IconButton";
import { Text } from "../Text";

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

interface DialogContextValue {
  announce: (message: string) => void;
  extras?: ReactNode;
}
const DialogContext = createContext<DialogContextValue | null>(null);

/** Announces through the open dialog's own live region (the page's is inert). */
export function useDialogAnnounce() {
  return useContext(DialogContext)?.announce;
}

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fullScreenOnMobile?: boolean;
  /**
   * Makes the dialog a form, so Enter in a field submits it. Give the main
   * action `type="submit"`. The handler gets the event with default
   * already prevented.
   */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  /**
   * Shown under the header, such as the recent roll cards
   * (Iron Link's DialogExtrasContext).
   */
  extras?: ReactNode;
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
    fullScreenOnMobile,
    onSubmit,
    extras,
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
      extras,
    }),
    [extras],
  );

  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
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

const headerStyles = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "3",
  paddingBlockStart: "4",
  paddingInlineStart: "5",
  paddingInlineEnd: "3",
  flex: "none",
});

export interface DialogHeaderProps {
  /** The dialog's name. Only this is the title element. */
  title: ReactNode;
  /** Buttons beside the title, before Close. */
  actions?: ReactNode;
  /** Label for the close button. */
  closeLabel?: string;
  hideClose?: boolean;
}

/**
 * The title and a Close button. Only the heading is the dialog's title, so
 * the dialog's accessible name is the title alone; buttons sit beside it.
 */
export function DialogHeader(props: DialogHeaderProps) {
  const { title, actions, closeLabel = "Close", hideClose } = props;
  const extras = useContext(DialogContext)?.extras;
  return (
    <>
      <div className={headerStyles}>
        <BaseDialog.Title
          render={<Text variant="h2" />}
          className={css({ minWidth: 0 })}
        >
          {title}
        </BaseDialog.Title>
        <div className={css({ display: "flex", gap: "1", flex: "none" })}>
          {actions}
          {!hideClose && (
            <BaseDialog.Close
              render={
                <IconButton label={closeLabel} tooltipSide="bottom">
                  <X />
                </IconButton>
              }
            />
          )}
        </div>
      </div>
      {extras}
    </>
  );
}

export function DialogDescription(props: ComponentProps<"p">) {
  const { className, ...rest } = props;
  return (
    <BaseDialog.Description
      className={cx(
        css({ color: "fg.muted", fontSize: "sm", margin: 0 }),
        className,
      )}
      {...rest}
    />
  );
}

export const dialogBodyStyles = css({
  display: "grid",
  alignContent: "start",
  gap: "4",
  paddingBlock: "3",
  paddingInline: "5",
  paddingBlockEnd: "5",
  overflowY: "auto",
  minHeight: 0,
  flex: "1 1 auto",
});

export function DialogBody(props: ComponentProps<"div">) {
  const { className, ...rest } = props;
  return <div className={cx(dialogBodyStyles, className)} {...rest} />;
}

export const dialogActionsStyles = css({
  display: "flex",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: "2",
  paddingBlock: "4",
  paddingInline: "5",
  borderTop: "1px solid token(colors.border.subtle)",
  background: "bg.muted",
  borderBottomRadius: "xl",
  flex: "none",
  smDown: { "[data-full-screen] &": { borderRadius: 0 } },
});

export function DialogActions(props: ComponentProps<"div">) {
  const { className, ...rest } = props;
  return <div className={cx(dialogActionsStyles, className)} {...rest} />;
}

/** Closes the dialog; give it a Button through `render`. */
export const DialogClose = BaseDialog.Close;
