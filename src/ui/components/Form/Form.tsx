import { Form as BaseForm } from "@base-ui/react/form";
import { FormEvent, ReactNode, Ref } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cx } from "styled-system/css";

export interface FormProps extends CssProp {
  children: ReactNode;
  /**
   * Called when the form is submitted, by a `type="submit"` button or Enter
   * in a field. Default is already prevented, so the page never reloads.
   */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  /**
   * Errors from the server, keyed by each field's `name`. Each field shows
   * its own until its value changes.
   */
  errors?: Record<string, string | string[]>;
  /**
   * When fields check their own rules (`required`, `validate`): on submit
   * (default), on blur, or on every change.
   */
  validationMode?: "onSubmit" | "onBlur" | "onChange";
  /** Space between fields. Default "4" (16px). */
  gap?: "2" | "3" | "4" | "5" | "6";
  id?: string;
  /** Names the form, such as the heading above it. */
  "aria-labelledby"?: string;
  className?: string;
  ref?: Ref<HTMLFormElement>;
}

const formStyles = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  alignContent: "start",
  margin: 0,
});

const gapStyles = {
  "2": css({ gap: "2" }),
  "3": css({ gap: "3" }),
  "4": css({ gap: "4" }),
  "5": css({ gap: "5" }),
  "6": css({ gap: "6" }),
};

/**
 * A form that stacks its fields and submits on Enter. It shows server errors
 * on the fields they name and turns off the browser's own validation
 * bubbles, so the library's errors show instead.
 *
 * Inside a Dialog, pass `onSubmit` to the Dialog instead: the dialog itself
 * becomes the form.
 *
 * ```tsx
 * <Form onSubmit={save} errors={{ name: "That name is taken." }}>
 *   <TextField name="name" label="Character Name" required />
 *   <Button type="submit" variant="primary">Save Character</Button>
 * </Form>
 * ```
 */
export function Form(props: FormProps) {
  const {
    children,
    onSubmit,
    errors,
    validationMode = "onSubmit",
    gap = "4",
    id,
    "aria-labelledby": ariaLabelledBy,
    className,
    ref,
  } = withCssProp(props);

  return (
    <BaseForm
      ref={ref}
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cx(formStyles, gapStyles[gap], className)}
      errors={errors}
      validationMode={validationMode}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(event);
      }}
    >
      {children}
    </BaseForm>
  );
}

/** A row of buttons at the end of a form, the main action last. */
export function FormActions(props: {
  children: ReactNode;
  className?: string;
}) {
  const { children, className } = props;
  return (
    <div
      className={cx(
        css({
          display: "flex",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: "2",
          marginTop: "2",
        }),
        className,
      )}
    >
      {children}
    </div>
  );
}
