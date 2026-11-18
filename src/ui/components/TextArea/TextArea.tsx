import { Field as BaseField } from "@base-ui/react/field";
import {
  ChangeEvent,
  ComponentProps,
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";

import { css, cx } from "styled-system/css";

import {
  FieldOwnProps,
  FieldShell,
  fieldInputStyles,
  fieldShellStyles,
  mergeRefs,
  useControllableState,
} from "../Field";

type NativeTextAreaProps = Omit<
  ComponentProps<"textarea">,
  | "value"
  | "defaultValue"
  | "onChange"
  | "className"
  | "children"
  | "ref"
  | "disabled"
  | "required"
  | "rows"
>;

export interface TextAreaProps extends FieldOwnProps, NativeTextAreaProps {
  value?: string;
  defaultValue?: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onValueChange?: (value: string) => void;
  /** Rows shown while empty. */
  minRows?: number;
  /** Rows it grows to before it scrolls. */
  maxRows?: number;
  size?: "sm" | "md";
  /** Class for the field (label, well, help and error together). */
  className?: string;
  /** Class for the well. */
  shellClassName?: string;
  /** Class for the textarea element itself. */
  inputClassName?: string;
  validate?: ComponentProps<typeof BaseField.Root>["validate"];
  validationMode?: ComponentProps<typeof BaseField.Root>["validationMode"];
}

const shell = css({
  alignItems: "stretch",
  paddingInline: 0,
});

const textarea = css({
  display: "block",
  paddingBlock: "2",
  paddingInline: "3",
  resize: "none",
  lineHeight: "normal",
  overflowY: "hidden",
  textOverflow: "clip",
  scrollPaddingBlock: "2",
});

const textareaSm = css({
  paddingBlock: "1.5",
  paddingInline: "10px",
});

/**
 * Multi-line text that grows with its content from `minRows` to `maxRows`,
 * then scrolls. Same well, label, help and error as TextField; the ref
 * reaches the textarea.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea(props, ref) {
    const {
      label,
      hideLabel,
      description,
      error,
      invalid,
      required,
      disabled,
      requiredIndicator,
      value: valueProp,
      defaultValue = "",
      onChange,
      onValueChange,
      minRows = 3,
      maxRows = 8,
      size = "md",
      className,
      shellClassName,
      inputClassName,
      readOnly,
      name,
      validate,
      validationMode,
      ...textareaProps
    } = props;

    const elementRef = useRef<HTMLTextAreaElement>(null);
    const [value, setValue] = useControllableState(
      valueProp,
      defaultValue,
      onValueChange,
    );

    const resize = useCallback(() => {
      const element = elementRef.current;
      if (!element) return;
      const style = getComputedStyle(element);
      const lineHeight = parseFloat(style.lineHeight) || 24;
      const padding =
        parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const min = lineHeight * minRows + padding;
      const max = lineHeight * Math.max(minRows, maxRows) + padding;
      element.style.height = "auto";
      const content = element.scrollHeight;
      element.style.height = `${Math.min(Math.max(content, min), max)}px`;
      element.style.overflowY = content > max + 1 ? "auto" : "hidden";
    }, [minRows, maxRows]);

    useLayoutEffect(resize, [resize, value]);

    useLayoutEffect(() => {
      const element = elementRef.current;
      if (!element || typeof ResizeObserver === "undefined") return;
      // Narrower means more wrapped lines, so measure again on width changes.
      let width = element.clientWidth;
      const observer = new ResizeObserver(() => {
        if (element.clientWidth === width) return;
        width = element.clientWidth;
        resize();
      });
      observer.observe(element);
      return () => observer.disconnect();
    }, [resize]);

    return (
      <FieldShell
        label={label}
        hideLabel={hideLabel}
        description={description}
        error={error}
        invalid={invalid}
        required={required}
        disabled={disabled}
        requiredIndicator={requiredIndicator}
        name={name}
        className={className}
        validate={validate}
        validationMode={validationMode}
      >
        <div
          className={cx(fieldShellStyles({ size }), shell, shellClassName)}
          data-disabled={disabled || undefined}
          data-readonly={readOnly || undefined}
        >
          <BaseField.Control
            render={<textarea />}
            ref={mergeRefs<HTMLElement>(ref as never, elementRef as never)}
            className={cx(
              fieldInputStyles,
              textarea,
              size === "sm" && textareaSm,
              inputClassName,
            )}
            value={value}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const target = event.target as unknown as HTMLTextAreaElement;
              onChange?.(event as unknown as ChangeEvent<HTMLTextAreaElement>);
              setValue(target.value);
            }}
            disabled={disabled}
            required={required}
            readOnly={readOnly}
            name={name}
            {...({ rows: minRows, ...textareaProps } as Record<
              string,
              unknown
            >)}
          />
        </div>
      </FieldShell>
    );
  },
);
