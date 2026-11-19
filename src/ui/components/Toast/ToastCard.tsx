import {
  CheckCircleIcon,
  InfoIcon,
  WarningIcon,
  WarningOctagonIcon,
  XIcon,
} from "@phosphor-icons/react";
import { ReactNode } from "react";

import { css, cva, cx } from "styled-system/css";

import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Spinner } from "../Spinner";

export type ToastTone = "info" | "success" | "warning" | "error" | "loading";

/**
 * Sonner's own toast look in the library's tokens: a light card (dark in
 * dark mode) with a hairline border and the floating shadow, the tone shown
 * by its icon alone. Older toasts peek out above it as bare card edges.
 */
const toastCardStyles = cva({
  base: {
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "3",
    width: "100%",
    minHeight: "52px",
    paddingBlock: "2",
    paddingInlineStart: "4",
    paddingInlineEnd: "2",
    borderRadius: "md",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.control",
    background: "bg.surface",
    color: "fg.default",
    boxShadow: "popover",
    fontFamily: "body",
    fontSize: "sm",
    lineHeight: "snug",
    textAlign: "start",
  },
});

const iconStyles = cva({
  base: {
    display: "inline-flex",
    flex: "none",
    "& svg": { width: "icon.md", height: "icon.md" },
  },
  variants: {
    tone: {
      info: { color: "info.fg" },
      success: { color: "success.fg" },
      warning: { color: "warning.fg" },
      error: { color: "danger.fg" },
      loading: { color: "fg.muted" },
    },
  },
});

const textStyles = css({
  display: "grid",
  gap: "0.5",
  flex: "1 1 auto",
  minWidth: 0,
  paddingBlock: "1",
});

const messageStyles = css({ fontWeight: "medium" });

const descriptionStyles = css({ color: "fg.muted", fontSize: "xs" });

const actionsStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
  flex: "none",
});

const toneIcons: Record<ToastTone, ReactNode> = {
  info: <InfoIcon weight="fill" />,
  success: <CheckCircleIcon weight="fill" />,
  warning: <WarningIcon weight="fill" />,
  error: <WarningOctagonIcon weight="fill" />,
  loading: <Spinner size={18} />,
};

export interface ToastCardProps {
  /** Picks the icon; leave it out for none. */
  tone?: ToastTone;
  /** Replaces the tone's icon. */
  icon?: ReactNode;
  message: ReactNode;
  description?: ReactNode;
  /** A button before Dismiss, such as Undo. */
  action?: { label: string; onClick: () => void };
  /** The named close button. Every toast has one. */
  onDismiss: () => void;
  dismissLabel?: string;
  className?: string;
  /** Anything else, laid out after the text and before the buttons. */
  children?: ReactNode;
}

/**
 * The card a toast renders. `toast.*` uses it; a custom toast (such as
 * a roll result) can render it too, so every toast shares the look and has
 * a Dismiss button.
 */
export function ToastCard(props: ToastCardProps) {
  const {
    tone,
    icon,
    message,
    description,
    action,
    onDismiss,
    dismissLabel = "Dismiss",
    className,
    children,
  } = props;

  const shownIcon = icon ?? (tone ? toneIcons[tone] : null);

  return (
    <div className={cx(toastCardStyles(), className)}>
      {shownIcon && (
        <span className={iconStyles({ tone: tone ?? "loading" })} aria-hidden>
          {shownIcon}
        </span>
      )}
      <div className={textStyles}>
        <div className={messageStyles}>{message}</div>
        {description && <div className={descriptionStyles}>{description}</div>}
      </div>
      {children}
      <div className={actionsStyles}>
        {action && (
          <Button
            variant="outline"
            size="sm"
            data-toast-action=""
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
        <IconButton label={dismissLabel} size="sm" onClick={onDismiss}>
          <XIcon />
        </IconButton>
      </div>
    </div>
  );
}
