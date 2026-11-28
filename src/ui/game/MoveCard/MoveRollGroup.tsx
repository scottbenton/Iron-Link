import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Text } from "ui/components/Text";
import { VisuallyHidden } from "ui/components/VisuallyHidden";
import { RollButton } from "ui/game/RollButton";
import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cx } from "styled-system/css";

import { MoveRollOption, formatRollValue } from "./moveData";

const sectionStyles = css({
  display: "grid",
  gap: "2",
  justifyItems: "start",
});

const rollRowStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "2",
});

const rollValueStyles = css({
  opacity: 0.8,
  fontVariantNumeric: "tabular-nums",
});

export interface MoveRollGroupProps<O extends MoveRollOption = MoveRollOption>
  extends CssProp {
  /** The move the buttons roll, which names the group. */
  moveName: string;
  /** The label above the buttons, read before each one: "Roll with". */
  label: string;
  /** Ways to roll the move; each is a roll button. */
  options: O[];
  onRoll?: (option: O) => void;
  /** Adds on the next roll, shown on each button's corner. */
  adds?: number;
  /** Controls after the buttons, such as the Adds stepper. */
  children?: ReactNode;
  className?: string;
}

/**
 * A move's roll buttons under their label: the stats, meters or tracks one
 * character can roll it with.
 */
export function MoveRollGroup<O extends MoveRollOption>(
  props: MoveRollGroupProps<O>,
) {
  const { moveName, label, options, onRoll, adds, children, className } =
    withCssProp(props);
  const { t } = useTranslation();

  return (
    <div
      className={cx(sectionStyles, className)}
      role="group"
      aria-label={t("ui.move-card.roll-group", "{{rollWith}}: {{move}}", {
        rollWith: label,
        move: moveName,
      })}
    >
      <Text variant="label" color="muted">
        {label}
      </Text>
      <div className={rollRowStyles}>
        {options.map((option) => (
          <RollButton
            key={option.id}
            size="sm"
            disabled={option.disabled}
            adds={adds}
            onClick={() => onRoll?.(option)}
          >
            <VisuallyHidden>{label} </VisuallyHidden>
            {option.label}
            {option.value !== undefined && (
              <span className={rollValueStyles}>
                {" "}
                {formatRollValue(option)}
              </span>
            )}
          </RollButton>
        ))}
        {children}
      </div>
    </div>
  );
}
