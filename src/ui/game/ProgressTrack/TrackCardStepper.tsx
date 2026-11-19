import { Minus, Plus } from "@phosphor-icons/react";

import { IconButton } from "../../components/IconButton";
import { trackCardStepperStyles } from "./trackCardStyles";

export interface TrackCardStepperProps {
  /** The minus button's name: "Remove progress from Recover the Hollow Crown". */
  minusLabel: string;
  /** The plus button's name: "Mark progress on Recover the Hollow Crown". */
  plusLabel: string;
  minusDisabled?: boolean;
  plusDisabled?: boolean;
  onMinus: () => void;
  onPlus: () => void;
}

/**
 * A track or clock card's minus and plus, in the header's corner beside the
 * menu: above what they change, so any actions under the boxes have the
 * row to themselves, and the title wraps beside them.
 */
export function TrackCardStepper(props: TrackCardStepperProps) {
  const {
    minusLabel,
    plusLabel,
    minusDisabled,
    plusDisabled,
    onMinus,
    onPlus,
  } = props;
  return (
    <span className={trackCardStepperStyles} data-stepper="">
      <IconButton
        label={minusLabel}
        size="sm"
        focusableWhenDisabled
        disabled={minusDisabled}
        onClick={onMinus}
      >
        <Minus weight="bold" />
      </IconButton>
      <IconButton
        label={plusLabel}
        size="sm"
        focusableWhenDisabled
        disabled={plusDisabled}
        onClick={onPlus}
      >
        <Plus weight="bold" />
      </IconButton>
    </span>
  );
}
