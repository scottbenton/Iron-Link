import { PaperPlaneRight } from "@phosphor-icons/react";
import { FormEvent, KeyboardEvent, useRef, useState } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cx } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { IconButton } from "../../components/IconButton";
import { Spinner } from "../../components/Spinner";

const formStyles = css({
  display: "flex",
  alignItems: "flex-end",
  gap: "1",
  paddingBlock: "1",
  paddingInlineStart: "3",
  paddingInlineEnd: "1",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.control",
  borderRadius: "lg",
  background: "bg.field",
  boxShadow: "field",
  transitionProperty: "border-color, box-shadow",
  transitionDuration: "fast",
  _focusWithin: {
    borderColor: "accent.fg",
    boxShadow: "token(shadows.field), 0 0 0 1px token(colors.accent.fg)",
  },
});

const textareaStyles = css({
  flex: "1",
  minWidth: 0,
  minHeight: "control.md",
  maxHeight: "128px",
  paddingBlock: "2",
  margin: 0,
  border: "none",
  outline: "none",
  background: "transparent",
  color: "fg.default",
  fontFamily: "body",
  fontSize: "sm",
  lineHeight: "normal",
  resize: "none",
  fieldSizing: "content",
  overflowY: "auto",
  _placeholder: { color: "fg.subtle" },
  _disabled: { color: "fg.disabled" },
  _touch: { fontSize: "md" },
});

export interface GameLogComposerProps extends LayoutProps {
  /**
   * Sends the message. Return a promise to keep the text and show the
   * button busy until it settles; a rejection keeps the text.
   */
  onSend: (message: string) => void | Promise<void>;
  disabled?: boolean;
  /** The field's name, "Message to the game log". */
  label?: string;
  placeholder?: string;
  sendLabel?: string;
  /** Announced once a message is sent, since the new entry is out of sight. */
  sentAnnouncement?: string;
  className?: string;
}

/**
 * The game log's message field. Enter sends, Shift+Enter starts a new line,
 * and the field grows to about five lines.
 */
export function GameLogComposer(props: GameLogComposerProps) {
  const {
    onSend,
    disabled,
    label = "Message to the game log",
    placeholder = "Write a message",
    sendLabel = "Send message",
    sentAnnouncement = "Message sent",
    className,
  } = withLayoutProps(props);

  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const announce = useAnnounce();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const message = value.trim();
    if (!message || sending || disabled) return;
    const result = onSend(message);
    if (result && typeof result.then === "function") {
      setSending(true);
      result
        .then(() => {
          setValue("");
          announce(sentAnnouncement);
        })
        .catch(() => {})
        .finally(() => setSending(false));
    } else {
      setValue("");
      announce(sentAnnouncement);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form
      ref={formRef}
      className={cx(formStyles, className)}
      onSubmit={handleSubmit}
    >
      <textarea
        className={textareaStyles}
        aria-label={label}
        placeholder={placeholder}
        rows={1}
        value={value}
        disabled={disabled}
        readOnly={sending}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <IconButton
        type="submit"
        label={sendLabel}
        variant="ghost"
        disabled={disabled || sending || !value.trim()}
        focusableWhenDisabled
      >
        {sending ? <Spinner /> : <PaperPlaneRight weight="fill" />}
      </IconButton>
    </form>
  );
}
