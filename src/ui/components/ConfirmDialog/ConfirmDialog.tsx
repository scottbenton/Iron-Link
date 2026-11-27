import { AlertDialog } from "@base-ui/react/alert-dialog";
import { ReactNode, useRef } from "react";
import { useTranslation } from "react-i18next";

import { css, cx } from "styled-system/css";

import { useRegisterOpenModal } from "../../hooks/useIsModalOpen";
import { LiveRegion } from "../Announcer";
import { Button, ButtonProps } from "../Button";
import {
  DialogHeader,
  dialogActionsStyles,
  dialogBackdropStyles,
  dialogBodyStyles,
  dialogPopupStyles,
} from "../Dialog";
import { HeadingOffset } from "../HeadingOffset";

const descriptionStyles = css({
  margin: 0,
  color: "fg.muted",
  fontSize: "sm",
  lineHeight: "normal",
  "& p": { margin: 0 },
  "& p + p": { marginBlockStart: "2" },
});

export type ConfirmButtonProps = Omit<
  ButtonProps,
  "onClick" | "children" | "variant"
>;

/** What a confirm says. Names follow material-ui-confirm's options. */
export interface ConfirmOptions {
  /** The question. */
  title?: ReactNode;
  /** One or two sentences under the title; describes the dialog. */
  description?: ReactNode;
  /** Anything more under the description, such as a list of what goes. */
  content?: ReactNode;
  /** The confirm button's label, such as "Remove Asset". */
  confirmationText?: ReactNode;
  /** The cancel button's label, such as "Keep Asset". */
  cancellationText?: ReactNode;
  /**
   * `danger` for an action that destroys or removes something: the confirm
   * button is red and Cancel takes focus first.
   */
  tone?: "default" | "danger";
  hideCancelButton?: boolean;
  /** Whether Escape and the Close button cancel. Defaults to true. */
  allowClose?: boolean;
  confirmationButtonProps?: ConfirmButtonProps;
  cancellationButtonProps?: ConfirmButtonProps;
  closeLabel?: string;
}

export interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Called once the closing transition ends. */
  onClosed?: () => void;
}

/**
 * A modal question with Cancel and a confirm button. Prefer `useConfirm()`,
 * which renders this and returns a promise; use the component when the
 * question needs live state.
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const { t } = useTranslation();
  const {
    open,
    onConfirm,
    onCancel,
    onClosed,
    title = t("ui.confirm-dialog.title", "Are you sure?"),
    description,
    content,
    confirmationText = t("ui.confirm-dialog.confirm", "Confirm"),
    cancellationText = t("ui.common.cancel", "Cancel"),
    tone = "default",
    hideCancelButton = false,
    allowClose = true,
    confirmationButtonProps,
    cancellationButtonProps,
    closeLabel,
  } = props;

  const cancelRef = useRef<HTMLElement>(null);
  const confirmRef = useRef<HTMLElement>(null);
  const hasBody = description !== undefined || content !== undefined;
  useRegisterOpenModal(open);

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && allowClose) onCancel();
      }}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) onClosed?.();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={dialogBackdropStyles} />
        <AlertDialog.Popup
          className={cx("ui-root", dialogPopupStyles({ size: "xs" }))}
          initialFocus={
            tone === "danger" && !hideCancelButton ? cancelRef : confirmRef
          }
        >
          <DialogHeader
            title={title}
            hideClose={!allowClose}
            closeLabel={closeLabel}
          />
          {hasBody ? (
            <div className={dialogBodyStyles}>
              {description !== undefined && (
                <AlertDialog.Description
                  render={<div />}
                  className={descriptionStyles}
                >
                  {description}
                </AlertDialog.Description>
              )}
              <HeadingOffset reset>{content}</HeadingOffset>
            </div>
          ) : (
            <div className={css({ height: "3" })} />
          )}
          <div className={dialogActionsStyles}>
            {!hideCancelButton && (
              <Button
                ref={cancelRef}
                variant="ghost"
                {...cancellationButtonProps}
                onClick={onCancel}
              >
                {cancellationText}
              </Button>
            )}
            <Button
              ref={confirmRef}
              variant={tone === "danger" ? "danger" : "primary"}
              {...confirmationButtonProps}
              onClick={onConfirm}
            >
              {confirmationText}
            </Button>
          </div>
          {/* The page is inert behind a modal; this reads the same store. */}
          <LiveRegion />
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
