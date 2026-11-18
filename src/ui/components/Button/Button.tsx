import { Button as BaseButton } from "@base-ui/react/button";
import { ComponentProps, ReactElement, ReactNode, forwardRef } from "react";

import { css, cx } from "styled-system/css";

import { GradientBox } from "../../game/GradientBox";
import { Spinner } from "../Spinner";
import {
  buttonStyles,
  gradientFaceStyles,
  gradientRingStyles,
} from "./buttonStyles";

const swap = css({
  display: "inline-grid",
  placeItems: "center",
  "& > *": {
    gridArea: "1 / 1",
    display: "inline-flex",
    alignItems: "center",
    gap: "2",
    transitionProperty: "opacity, filter, scale",
    transitionDuration: "normal",
    transitionTimingFunction: "out",
    _reducedMotion: { filter: "none!", scale: "1!" },
  },
  "& > [data-on=false]": {
    opacity: 0,
    filter: "blur(4px)",
    scale: "0.92",
    pointerEvents: "none",
  },
});

export interface ButtonProps
  extends Omit<ComponentProps<typeof BaseButton>, "className" | "render"> {
  variant?: "outline" | "primary" | "gradient" | "danger" | "ghost" | "text";
  size?: "sm" | "md";
  fullWidth?: boolean;
  /** Square, for an icon alone. Prefer IconButton, which names it. */
  iconOnly?: boolean;
  /** An icon before the label. */
  startIcon?: ReactNode;
  /** An icon after the label. */
  endIcon?: ReactNode;
  /**
   * Shows a spinner and the loading label in place of the label, at the same
   * width, and ignores presses. No ellipsis on the label (CLAUDE.md).
   */
  loading?: boolean;
  /** What the button says while loading, such as "Creating World". */
  loadingLabel?: ReactNode;
  className?: string;
  /**
   * Render as another element, such as a router link:
   * `render={<Link to="/" />}` with `nativeButton={false}`.
   */
  render?: ReactElement;
}

/**
 * The library's button. Outline by default; `primary` for the main action,
 * `gradient` for a main flow's call to action (Start Playing, Create Game:
 * a dark face in a spinning gradient ring, the app's `GradientButton`),
 * `danger` for a destructive confirm, `ghost` and `text` for low emphasis.
 */
export const Button = forwardRef<HTMLElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant,
      size,
      fullWidth,
      iconOnly,
      startIcon,
      endIcon,
      loading = false,
      loadingLabel,
      children,
      className,
      disabled,
      onClick,
      ...rest
    } = props;

    const content = (
      <>
        {startIcon}
        {children}
        {endIcon}
      </>
    );

    const label =
      loadingLabel === undefined ? (
        loading ? (
          <>
            <Spinner />
            <span className={css({ opacity: 0.85 })}>{children}</span>
          </>
        ) : (
          content
        )
      ) : (
        <span className={swap}>
          <span data-on={!loading} aria-hidden={loading || undefined}>
            {content}
          </span>
          <span data-on={loading} aria-hidden={!loading || undefined}>
            <Spinner />
            {loadingLabel}
          </span>
        </span>
      );

    return (
      <BaseButton
        ref={ref}
        className={cx(
          buttonStyles({ variant, size, fullWidth, iconOnly }),
          className,
        )}
        disabled={disabled}
        focusableWhenDisabled={loading || undefined}
        aria-disabled={loading || undefined}
        data-busy={loading || undefined}
        onClick={(event) => {
          if (loading) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
        {...rest}
      >
        {variant === "gradient" ? (
          <GradientBox
            as="span"
            variant="fill"
            radius="md"
            spin
            className={gradientRingStyles}
            data-gradient-ring=""
          >
            <span className={gradientFaceStyles} data-gradient-face="">
              {label}
            </span>
          </GradientBox>
        ) : (
          label
        )}
      </BaseButton>
    );
  },
);
