import { Check } from "@phosphor-icons/react";
import { ComponentProps, ReactNode } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cx } from "styled-system/css";

import { VisuallyHidden } from "../VisuallyHidden";
import { focusRing } from "ui/styles/focus";

export interface StepperStep {
  label: ReactNode;
  /** A short line under the label, such as "Optional". */
  description?: ReactNode;
}

type StepState = "complete" | "current" | "upcoming";

const listStyles = css({
  display: "flex",
  alignItems: "flex-start",
  margin: 0,
  padding: 0,
  listStyle: "none",
  fontFamily: "body",
  "--step-size": "28px",
  "--step-gap": "{spacing.2}",
});

const stepStyles = css({
  position: "relative",
  display: "flex",
  minWidth: 0,
  "--connector": "{colors.border.default}",
  "&[data-state=complete], &[data-state=current]": {
    "--connector": "{colors.accent.solid}",
  },
  // The connector runs from the previous indicator to this one.
  flex: "1 1 0",
  flexDirection: "column",
  alignItems: "center",
  gap: "2",
  textAlign: "center",
  paddingInline: "1",
  "&:not(:first-child)::before": {
    content: '""',
    position: "absolute",
    top: "calc(var(--step-size) / 2 - 1px)",
    left: "calc(-50% + var(--step-size) / 2 + var(--step-gap))",
    right: "calc(50% + var(--step-size) / 2 + var(--step-gap))",
    height: "2px",
    borderRadius: "full",
    background: "var(--connector)",
  },
});

const indicatorStyles = css({
  display: "grid",
  placeItems: "center",
  flex: "none",
  boxSizing: "border-box",
  width: "var(--step-size)",
  height: "var(--step-size)",
  borderRadius: "full",
  border: "2px solid token(colors.border.control)",
  background: "bg.surface",
  color: "fg.muted",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "sm",
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1,
  transition:
    "background-color token(durations.normal) linear, border-color token(durations.normal) linear, color token(durations.normal) linear",
  "[data-state=current] > * > &, [data-state=current] > &": {
    borderColor: "accent.solid",
    color: "accent.fg",
  },
  "[data-state=complete] > * > &, [data-state=complete] > &": {
    borderColor: "accent.solid",
    background: "accent.solid",
    color: "accent.onSolid",
  },
  "& svg": { width: "14px", height: "14px" },
});

const labelStyles = css({
  display: "grid",
  gap: "0.5",
  minWidth: 0,
  fontSize: "sm",
  fontWeight: "semibold",
  lineHeight: "snug",
  color: "fg.muted",
  "[data-state=current] &, [data-state=complete] &": { color: "fg.default" },
  "& [data-description]": {
    fontSize: "xs",
    fontWeight: "normal",
    color: "fg.muted",
  },
});

const stepButtonStyles = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "2",
  minWidth: 0,
  margin: "-1",
  padding: "1",
  border: 0,
  borderRadius: "md",
  background: "transparent",
  font: "inherit",
  color: "inherit",
  textAlign: "inherit",
  cursor: "pointer",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  transition: "background-color token(durations.fast) linear",
  _hover: { background: "overlay.hover" },
  _pressed: { background: "overlay.pressed" },
  _focusVisible: focusRing.inset,
});

export interface StepperProps
  extends Omit<ComponentProps<"ol">, "children">,
    LayoutProps {
  steps: StepperStep[];
  /** The index of the current step; earlier steps are complete. */
  activeStep: number;
  /**
   * Go back to a completed step. With it, completed steps are buttons.
   */
  onStepSelect?: (index: number) => void;
  /** Read after a completed step's label. */
  completedLabel?: string;
  /** Names the list. */
  "aria-label"?: string;
}

/**
 * Progress through a flow of steps, such as creating a game. The current
 * step says `aria-current="step"`; completed steps say so to screen
 * readers and show a check.
 */
export function Stepper(props: StepperProps) {
  const {
    steps,
    activeStep,
    onStepSelect,
    completedLabel = "Completed",
    "aria-label": ariaLabel = "Progress",
    className,
    ...rest
  } = withLayoutProps(props);
  return (
    <ol aria-label={ariaLabel} className={cx(listStyles, className)} {...rest}>
      {steps.map((step, index) => {
        const state: StepState =
          index < activeStep
            ? "complete"
            : index === activeStep
              ? "current"
              : "upcoming";
        const content = (
          <>
            <span className={indicatorStyles} aria-hidden>
              {state === "complete" ? <Check weight="bold" /> : index + 1}
            </span>
            <span className={labelStyles}>
              <span>
                {step.label}
                {state === "complete" && (
                  <VisuallyHidden> ({completedLabel})</VisuallyHidden>
                )}
              </span>
              {step.description && (
                <span data-description="">{step.description}</span>
              )}
            </span>
          </>
        );
        return (
          <li
            key={index}
            data-state={state}
            aria-current={state === "current" ? "step" : undefined}
            className={stepStyles}
          >
            {onStepSelect && state === "complete" ? (
              <button
                type="button"
                className={stepButtonStyles}
                onClick={() => onStepSelect(index)}
              >
                {content}
              </button>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
}
