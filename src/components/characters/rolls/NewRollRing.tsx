import { keyframes } from "@mui/material/styles";

import { GradientRing } from "components/GradientRing";

// The gap the new roll's gradient ring shows through, around the card.
const RING_WIDTH = 2;

// Holds the ring on a new roll's card, then lets it fade.
const newRollRing = keyframes`
  0%, 55% { opacity: 1; }
  100% { opacity: 0; }
`;

/**
 * The rotating gradient ring a new roll's card gets once, drawn behind the
 * card in a positioned parent (the card covers its middle). Key it by the
 * roll so a later roll rings again.
 */
export function NewRollRing() {
  return (
    <GradientRing
      data-testid={"roll-stack-new-ring"}
      sx={(theme) => ({
        inset: -RING_WIDTH,
        borderRadius: `${theme.shape.borderRadius + RING_WIDTH}px`,
        animation: `${newRollRing} 2600ms ease-out forwards`,
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
          opacity: 0,
        },
      })}
    />
  );
}
