import { ReactNode } from "react";

/** A field's size: `md` by default, `sm` for dense panels. */
export type FieldSize = "sm" | "md";

/**
 * The props every form control shares for its label, help text and error.
 * Controls take them directly, MUI style (`<TextField label error />`), and
 * wire them to the control with aria for you.
 */
export interface FieldOwnProps {
  /** The visible label. Leave it out only when `aria-label` names the control. */
  label?: ReactNode;
  /** Keep the label for screen readers but hide it from view. */
  hideLabel?: boolean;
  /** Help text under the control, read as its description. */
  description?: ReactNode;
  /**
   * An error message under the control, also read as its description. Any message marks the field invalid;
   * `true` marks it invalid without a message.
   */
  error?: ReactNode;
  /** Marks the field invalid without a message (use `error` for one). */
  invalid?: boolean;
  /** The control must be filled. Adds a marker after the label. */
  required?: boolean;
  disabled?: boolean;
  /** The marker after a required field's label. Hidden from screen readers. */
  requiredIndicator?: ReactNode;
}
