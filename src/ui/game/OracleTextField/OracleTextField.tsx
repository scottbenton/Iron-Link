import { forwardRef } from "react";

import { css, cx } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { fieldIconButtonStyles } from "../../components/Field";
import { TextField, TextFieldProps } from "../../components/TextField";
import { Tooltip } from "../../components/Tooltip";
import { useControllableState } from "../../hooks/useControllableState";
import { DieFace, useDieFace } from "../DieFace";

/**
 * The roll button inside the well: the field's small ghost button, with the
 * gradient ring that marks oracle buttons showing on hover, press and
 * keyboard focus (as on a stat card), so it reads as a roll and not a clear.
 */
const oracleButtonStyles = css({
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    padding: "1.5px",
    borderRadius: "inherit",
    background: "token(gradients.ring)",
    // Only the 1.5px edge shows: the content box is cut out of the fill.
    mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    maskComposite: "exclude",
    opacity: 0,
    transitionProperty: "opacity",
    transitionDuration: "fast",
    transitionTimingFunction: "linear",
    pointerEvents: "none",
  },
  "&:is(:hover, :focus-visible, :active, [data-pressed]):not(:disabled)::before":
    { opacity: 1 },
});

export interface OracleTextFieldProps extends TextFieldProps {
  /**
   * Rolls the oracle and returns its result, which replaces the text. Return
   * nothing to leave the field as it is. The library never rolls itself:
   * the app passes its own roller (`useRollOracle`).
   */
  onRoll: () => string | undefined;
  /**
   * The oracle's name, such as "Settlement Name". It names the button
   * ("Roll Settlement Name") and its tooltip.
   */
  oracleName: string;
  /** The button's name and tooltip. Defaults to `Roll {oracleName}`. */
  rollLabel?: string;
  /**
   * What a screen reader hears after a roll. Defaults to "Updated {label}
   * to {result}". Pass a function returning `false` to stay silent, for
   * example when a dialog announces it through `useDialogAnnounce()`.
   */
  rollAnnouncement?: (result: string) => string | false;
}

/**
 * A text field with a dice button that rolls an oracle into it, for names
 * and other values an oracle can suggest (a character's or settlement's
 * name, a world entry's fields). The roll replaces the text, keeps focus on
 * the button so it can be rolled again, and is announced. Works at every
 * size and variant, including `size="sm" variant="quiet"` for details
 * panels.
 *
 * ```tsx
 * <OracleTextField
 *   label="Name"
 *   oracleName="Settlement Name"
 *   onRoll={() => rollOracle("starforged/settlement/name")}
 *   value={name}
 *   onValueChange={setName}
 * />
 * ```
 */
export const OracleTextField = forwardRef<
  HTMLInputElement,
  OracleTextFieldProps
>(function OracleTextField(props, ref) {
  const {
    onRoll,
    oracleName,
    rollLabel = `Roll ${oracleName}`,
    rollAnnouncement,
    value: valueProp,
    defaultValue = "",
    onValueChange,
    endAdornment,
    label,
    disabled,
    readOnly,
    ...rest
  } = props;

  const announce = useAnnounce();
  const [value, setValue] = useControllableState(
    valueProp,
    defaultValue,
    onValueChange,
  );

  // Each roll turns the die to a new face, crossfading from the old one.
  // Only the field that rolled changes, so a form full of these stays calm.
  const [face, rollDie] = useDieFace();

  const handleRoll = () => {
    rollDie();
    const result = onRoll();
    if (result === undefined) return;
    setValue(result);
    const name = typeof label === "string" ? label : oracleName;
    const spoken = rollAnnouncement
      ? rollAnnouncement(result)
      : `Updated ${name} to ${result}`;
    if (spoken) announce(spoken);
  };

  const canRoll = !disabled && !readOnly;

  return (
    <TextField
      ref={ref}
      label={label}
      disabled={disabled}
      readOnly={readOnly}
      value={value}
      onValueChange={setValue}
      endAdornment={
        canRoll ? (
          <>
            {endAdornment}
            <Tooltip title={rollLabel}>
              <button
                type="button"
                className={cx(fieldIconButtonStyles, oracleButtonStyles)}
                aria-label={rollLabel}
                onClick={handleRoll}
              >
                <DieFace face={face} />
              </button>
            </Tooltip>
          </>
        ) : (
          endAdornment
        )
      }
      {...rest}
    />
  );
});
