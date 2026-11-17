import ExampleIcon from "@mui/icons-material/Casino";
import { useTranslation } from "react-i18next";

import { RollButton } from "components/datasworn/RollButton";

import { formatSignedValue } from "lib/formatSignedValue";

export interface StatProps {
  label: string;
  value: number;
  onActionClick?: () => void;
  action?: {
    ActionIcon: typeof ExampleIcon;
    actionLabel: string;
  };
  disabled?: boolean;
}

/**
 * A stat as a roll button: its name, the dice and its value on one dark
 * button, named for what it does ("Roll Edge, +2"). Without an action, or
 * disabled, it shows the same face as plain text.
 */
export function Stat(props: StatProps) {
  const { label, value, onActionClick, action, disabled } = props;
  const { ActionIcon, actionLabel } = action ?? {};

  const { t } = useTranslation();

  const valueText = formatSignedValue(value);
  const isActionButton = !!onActionClick && !disabled;

  return (
    <RollButton
      size="stat"
      label={label}
      value={valueText}
      ActionIcon={ActionIcon}
      iconTestId={label + actionLabel}
      onClick={isActionButton ? onActionClick : undefined}
      aria-label={
        actionLabel
          ? t(
              "datasworn.meter-action-named",
              "{{action}} {{label}}, {{value}}",
              {
                action: actionLabel,
                label,
                value: valueText,
              },
            )
          : t("datasworn.meter-value-named", "{{label}}, {{value}}", {
              label,
              value: valueText,
            })
      }
    />
  );
}
