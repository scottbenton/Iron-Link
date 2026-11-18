import { Check, Copy } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { useAnnounce } from "ui/components/Announcer";
import { Button, ButtonProps } from "ui/components/Button";
import { IconButton } from "ui/components/IconButton";

import { css } from "styled-system/css";

const swapStyles = css({
  display: "inline-grid",
  placeItems: "center",
  "& > *": {
    gridArea: "1 / 1",
    transitionProperty: "opacity, filter, scale",
    transitionDuration: "normal",
    transitionTimingFunction: "out",
    _reducedMotion: { filter: "none!", scale: "1!" },
  },
  "& > [data-on=false]": {
    opacity: 0,
    filter: "blur(3px)",
    scale: "0.6",
  },
  "& > [data-copied]": { color: "success.fg" },
});

export interface CopyButtonProps
  extends Omit<
    ButtonProps,
    "children" | "onClick" | "startIcon" | "endIcon" | "iconOnly"
  > {
  /** The text to copy, or a function that returns it when pressed. */
  text: string | (() => string);
  /** The button's name, and its visible label unless `iconOnly`. */
  label?: string;
  /** Announced, and shown in place of the label, once copied. */
  copiedLabel?: string;
  /** Announced when the clipboard refuses. */
  failedLabel?: string;
  /** A square icon button with the label as its tooltip. */
  iconOnly?: boolean;
  /** How long the check shows, in milliseconds. */
  resetAfter?: number;
  onCopied?: () => void;
}

/**
 * Copies text to the clipboard. The copy icon turns into a check for a moment
 * and "Copied" is announced.
 */
export function CopyButton(props: CopyButtonProps) {
  const {
    text,
    label = "Copy",
    copiedLabel = "Copied",
    failedLabel = "Could not copy",
    iconOnly,
    resetAfter = 2000,
    onCopied,
    variant,
    ...rest
  } = props;

  const announce = useAnnounce();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = () => {
    const value = typeof text === "function" ? text() : text;
    navigator.clipboard.writeText(value).then(
      () => {
        setCopied(true);
        announce(copiedLabel);
        onCopied?.();
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), resetAfter);
      },
      () => announce(failedLabel),
    );
  };

  const icon = (
    <span className={swapStyles} aria-hidden>
      <Copy data-on={!copied} />
      <Check data-on={copied} data-copied="" weight="bold" />
    </span>
  );

  if (iconOnly) {
    return (
      <IconButton
        label={copied ? copiedLabel : label}
        variant={variant}
        onClick={copy}
        {...rest}
      >
        {icon}
      </IconButton>
    );
  }

  return (
    <Button variant={variant ?? "outline"} onClick={copy} {...rest}>
      {icon}
      <span className={swapStyles}>
        <span data-on={!copied} aria-hidden={copied || undefined}>
          {label}
        </span>
        <span data-on={copied} aria-hidden={!copied || undefined}>
          {copiedLabel}
        </span>
      </span>
    </Button>
  );
}
