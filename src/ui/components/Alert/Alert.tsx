import {
  CheckCircleIcon,
  InfoIcon,
  SkullIcon,
  WarningIcon,
  WarningOctagonIcon,
  XIcon,
} from "@phosphor-icons/react";
import { ComponentProps, ReactNode } from "react";

import { css, cva, cx } from "styled-system/css";

import { IconButton } from "../IconButton";

export type AlertTone = "info" | "success" | "warning" | "danger" | "cursed";

const toneIcons: Record<AlertTone, ReactNode> = {
  info: <InfoIcon weight="fill" />,
  success: <CheckCircleIcon weight="fill" />,
  warning: <WarningIcon weight="fill" />,
  danger: <WarningOctagonIcon weight="fill" />,
  cursed: <SkullIcon weight="fill" />,
};

const alertStyles = cva({
  base: {
    boxSizing: "border-box",
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr) auto",
    alignItems: "start",
    columnGap: "3",
    paddingBlock: "3",
    paddingInlineStart: "4",
    paddingInlineEnd: "3",
    borderRadius: "lg",
    // A static message: a tone-coloured border all round on the soft tint,
    // with no ledge (nothing to press) and no inset (not a field).
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "var(--alert-fg)",
    background: "var(--alert-soft)",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "sm",
    lineHeight: "normal",
  },
  variants: {
    tone: {
      info: {
        "--alert-fg": "{colors.info.fg}",
        "--alert-soft": "{colors.info.soft}",
      },
      success: {
        "--alert-fg": "{colors.success.fg}",
        "--alert-soft": "{colors.success.soft}",
      },
      warning: {
        "--alert-fg": "{colors.warning.fg}",
        "--alert-soft": "{colors.warning.soft}",
      },
      danger: {
        "--alert-fg": "{colors.danger.fg}",
        "--alert-soft": "{colors.danger.soft}",
      },
      cursed: {
        "--alert-fg": "{colors.cursed.fg}",
        "--alert-soft": "{colors.cursed.soft}",
      },
    },
  },
  defaultVariants: { tone: "info" },
});

const iconStyles = css({
  display: "inline-flex",
  // Centres a 20px icon on the first line of text.
  paddingBlockStart: "1px",
  color: "var(--alert-fg)",
  "& svg": { width: "20px", height: "20px" },
});

const contentStyles = css({
  display: "grid",
  gap: "1",
  minWidth: 0,
  paddingBlockStart: "1px",
});

const titleStyles = css({
  margin: 0,
  fontFamily: "body",
  fontSize: "sm",
  fontWeight: "semibold",
  lineHeight: "snug",
  // The tone colours the icon and the title only, so the alert reads as its
  // tone at a glance. The body stays default text: tone text on a tint is
  // lower contrast and tiring over more than a line.
  color: "var(--alert-fg)",
});

const bodyStyles = css({
  color: "fg.default",
  "& p": { margin: 0 },
  "& p + p": { marginBlockStart: "1" },
});

const actionsStyles = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
  marginBlockStart: "2",
});

const closeStyles = css({
  marginBlock: "-1",
  marginInlineEnd: "-1",
});

export interface AlertProps
  extends Omit<ComponentProps<"div">, "title" | "children"> {
  tone?: AlertTone;
  /** A short summary in bold, like MUI's AlertTitle. */
  title?: ReactNode;
  /** The message. */
  children?: ReactNode;
  /** Buttons under the message, such as "Turn Them On". */
  action?: ReactNode;
  /** Replaces the tone's icon; pass `null` for none. */
  icon?: ReactNode;
  /** Shows a Close button that calls this. */
  onClose?: () => void;
  closeLabel?: string;
  /** The title's element. A label that only looks like a heading stays a div. */
  titleAs?: "div" | "h2" | "h3" | "h4" | "p";
}

/**
 * A message inside the page, tinted by tone. It is not a live region; pass
 * `role="alert"` or `role="status"` only for a message that appears in
 * response to something the person did, or announce it with `useAnnounce`.
 */
export function Alert(props: AlertProps) {
  const {
    tone = "info",
    title,
    children,
    action,
    icon,
    onClose,
    closeLabel = "Dismiss",
    titleAs: TitleTag = "div",
    className,
    ...rest
  } = props;

  const shownIcon = icon === undefined ? toneIcons[tone] : icon;

  return (
    <div className={cx(alertStyles({ tone }), className)} {...rest}>
      <span className={iconStyles} aria-hidden>
        {shownIcon}
      </span>
      <div className={contentStyles}>
        {title !== undefined && (
          <TitleTag className={titleStyles}>{title}</TitleTag>
        )}
        {children !== undefined && <div className={bodyStyles}>{children}</div>}
        {action !== undefined && <div className={actionsStyles}>{action}</div>}
      </div>
      {onClose ? (
        <IconButton
          label={closeLabel}
          size="sm"
          onClick={onClose}
          className={closeStyles}
        >
          <XIcon />
        </IconButton>
      ) : (
        <span />
      )}
    </div>
  );
}
