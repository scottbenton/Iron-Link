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

const toastCardStyles = cva({
  base: {
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "3",
    width: "100%",
    minHeight: "48px",
    paddingBlock: "2",
    paddingInlineStart: "4",
    paddingInlineEnd: "2",
    borderRadius: "md",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "gray.700",
    background: "gray.800",
    color: "gray.50",
    boxShadow: "0 3px 0 token(colors.gray.950)",
    fontFamily: "body",
    fontSize: "sm",
    lineHeight: "snug",
    textAlign: "start",
    // Buttons inside are ghost buttons on a dark chip in either colour mode.
    "& button": {
      "--btn-fg": "{colors.gray.50}",
      "--btn-hover": "color-mix(in oklab, white 12%, transparent)",
      "--btn-press": "color-mix(in oklab, white 20%, transparent)",
      _focusVisible: { outlineColor: "gray.50" },
    },
    "& [data-toast-action]": {
      "--btn-fg":
        "color-mix(in oklab, token(colors.scheme.dark.fg) 80%, white)",
    },
  },
});

const iconStyles = cva({
  base: {
    display: "inline-flex",
    flex: "none",
    "& svg": { width: "20px", height: "20px" },
  },
  variants: {
    tone: {
      info: { color: "status.info.dark" },
      success: { color: "status.success.dark" },
      warning: { color: "status.warning.dark" },
      error: { color: "status.danger.dark" },
      loading: { color: "gray.200" },
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

const descriptionStyles = css({ color: "gray.300", fontSize: "xs" });

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
 * The dark chip a toast renders. `toast.*` uses it; a custom toast (such as
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
        <div>{message}</div>
        {description && <div className={descriptionStyles}>{description}</div>}
      </div>
      {children}
      <div className={actionsStyles}>
        {action && (
          <Button
            variant="ghost"
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
