/**
 * The game page columns' own tabs, as rail buttons for a collapsed sidebar.
 * Story-only, beside GamePageColumns.
 */
import {
  CardsIcon,
  ChatsCircleIcon,
  DiceFiveIcon,
  FlagBannerIcon,
  HandFistIcon,
  IdentificationCardIcon,
} from "@phosphor-icons/react";

import type { LayoutSection } from "../shared/layoutPanel";

/** The character column's tabs, for the collapsed sidebar's rail. */
export const characterSections: LayoutSection[] = [
  { id: "overview", title: "Overview", icon: <IdentificationCardIcon /> },
  { id: "assets", title: "Assets", icon: <CardsIcon /> },
  { id: "tracks", title: "Tracks", icon: <FlagBannerIcon /> },
];

/** The reference column's tabs. */
export const referenceSections: LayoutSection[] = [
  { id: "moves", title: "Moves", icon: <HandFistIcon /> },
  { id: "oracles", title: "Oracles", icon: <DiceFiveIcon /> },
  { id: "log", title: "Game Log", icon: <ChatsCircleIcon /> },
];
