import { CheckCircleIcon } from "@phosphor-icons/react";

import { css } from "styled-system/css";

import { Button } from "../../components/Button";
import type { TracksPanelStrings } from "./tracksPanelStrings";

/** Complete sits at the end of the actions row, after the rolls. */
const completeStyles = css({ marginInlineStart: "auto" });

export function CompleteButton(props: {
  label: string;
  onClick: () => void;
  strings: TracksPanelStrings;
}) {
  const { label, onClick, strings } = props;
  return (
    <Button
      size="sm"
      variant="ghost"
      className={completeStyles}
      startIcon={<CheckCircleIcon />}
      aria-label={strings.completeLabel(label)}
      onClick={onClick}
    >
      {strings.completeShort}
    </Button>
  );
}
