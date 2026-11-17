import { Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";

// The gap the new roll's gradient ring shows through, around the card.
const RING_WIDTH = 2;

// Holds the ring on a new roll's card, then lets it fade.
const newRollRing = keyframes`
  0%, 55% { opacity: 1; }
  100% { opacity: 0; }
`;

/**
 * The gradient ring a new roll's card gets once, drawn behind the card in a
 * positioned parent. Key it by the roll so a later roll rings again.
 */
export function NewRollRing() {
  return (
    <Box
      aria-hidden
      data-testid={"roll-stack-new-ring"}
      sx={(theme) => ({
        position: "absolute",
        inset: -RING_WIDTH,
        borderRadius: `${theme.shape.borderRadius + RING_WIDTH}px`,
        background: theme.palette.gradients.outline,
        pointerEvents: "none",
        animation: `${newRollRing} 2600ms ease-out forwards`,
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
          opacity: 0,
        },
      })}
    />
  );
}
