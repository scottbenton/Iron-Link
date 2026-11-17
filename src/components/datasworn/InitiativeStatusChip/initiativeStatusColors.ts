import { Theme } from "@mui/material";

import { InitiativeStatus } from "repositories/character.repository";

export type InitiativeStatusColor = "success" | "error" | "neutral";

/**
 * The colour each initiative status wears, shared by the chip and the phone
 * sheet's segmented control so the two always agree. Out of combat is a
 * neutral grey rather than a status colour.
 */
export const initiativeStatusColors: Record<
  InitiativeStatus,
  InitiativeStatusColor
> = {
  [InitiativeStatus.HasInitiative]: "success",
  [InitiativeStatus.DoesNotHaveInitiative]: "error",
  [InitiativeStatus.OutOfCombat]: "neutral",
};

export interface InitiativeStatusFill {
  main: string;
  /** For hover and focus on a filled control. */
  dark: string;
  contrastText: string;
}

/**
 * The fill and text colours for a status. The neutral grey is dark with white
 * text in light mode and light with dark text in dark mode, so it stands out
 * from the page and keeps its text well above AA contrast in both.
 */
export function getInitiativeStatusFill(
  theme: Theme,
  status: InitiativeStatus,
): InitiativeStatusFill {
  const color = initiativeStatusColors[status];
  if (color === "neutral") {
    const { grey } = theme.palette;
    return theme.palette.mode === "light"
      ? {
          main: grey[600],
          dark: grey[700],
          contrastText: theme.palette.common.white,
        }
      : { main: grey[300], dark: grey[400], contrastText: grey[900] };
  }
  const { main, dark, contrastText } = theme.palette[color];
  return { main, dark, contrastText };
}
