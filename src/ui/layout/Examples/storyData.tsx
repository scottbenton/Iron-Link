/**
 * Shared content for the layout stories. Story-only: nothing outside
 * *.stories.tsx and these Examples helpers imports it.
 */
import {
  BookOpenIcon,
  FlaskIcon,
  GlobeHemisphereWestIcon,
  SwordIcon,
} from "@phosphor-icons/react";

import { NavItem } from "../shared/navItem";

export type NavDestination = "games" | "worlds" | "homebrew" | "reference";

/** The app's four destinations, with `current` on one of them. */
export function getNavItems(current?: NavDestination): NavItem[] {
  return [
    {
      id: "games",
      label: "Games",
      href: "#games",
      icon: <SwordIcon />,
      currentIcon: <SwordIcon weight="fill" />,
    },
    {
      id: "worlds",
      label: "Worlds",
      href: "#worlds",
      icon: <GlobeHemisphereWestIcon />,
      currentIcon: <GlobeHemisphereWestIcon weight="fill" />,
    },
    {
      id: "homebrew",
      label: "Homebrew",
      href: "#homebrew",
      icon: <FlaskIcon />,
      currentIcon: <FlaskIcon weight="fill" />,
    },
    {
      id: "reference",
      label: "Reference",
      href: "#reference",
      icon: <BookOpenIcon />,
      currentIcon: <BookOpenIcon weight="fill" />,
    },
  ].map((item) => ({ ...item, current: item.id === current }));
}

/** A painted-looking band of mountains under a dusk sky, for hero images. */
export const heroImageSrc = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3350"/><stop offset="1" stop-color="#c47b4a"/></linearGradient></defs>
  <rect width="1200" height="300" fill="url(#s)"/>
  <path d="M0 220 L140 120 L260 200 L400 90 L560 210 L700 110 L860 200 L1000 100 L1200 210 V300 H0Z" fill="#3a3346"/>
  <path d="M0 260 L180 190 L340 250 L520 180 L720 260 L900 200 L1200 260 V300 H0Z" fill="#1e1b26"/>
</svg>`,
)}`;
