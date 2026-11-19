/** Sample characters and players for stories. */
export interface SampleCharacter {
  id: string;
  name: string;
  playerName: string;
  portraitUrl?: string;
  /** Hue for a generated portrait background. */
  colorSeed: number;
  stats: Record<"edge" | "heart" | "iron" | "shadow" | "wits", number>;
  meters: Record<"health" | "spirit" | "supply" | "momentum", number>;
}

export const sampleCharacters: SampleCharacter[] = [
  {
    id: "kira",
    name: "Kira Vale",
    playerName: "Scott",
    colorSeed: 12,
    stats: { edge: 3, heart: 2, iron: 1, shadow: 1, wits: 2 },
    meters: { health: 5, spirit: 4, supply: 3, momentum: 6 },
  },
  {
    id: "orrin",
    name: "Orrin Thale",
    playerName: "Phoebe",
    colorSeed: 210,
    stats: { edge: 1, heart: 3, iron: 2, shadow: 2, wits: 1 },
    meters: { health: 3, spirit: 5, supply: 2, momentum: 2 },
  },
  {
    id: "senna",
    name: "Senna Ash-Eye",
    playerName: "Morgan",
    colorSeed: 140,
    stats: { edge: 2, heart: 1, iron: 3, shadow: 1, wits: 2 },
    meters: { health: 1, spirit: 2, supply: 5, momentum: -2 },
  },
];

/** A painted-looking head and shoulders, standing in for an uploaded portrait. */
export const samplePortraitSrc = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d4a66"/><stop offset="1" stop-color="#b8734a"/></linearGradient></defs><rect width="80" height="80" fill="url(#b)"/><path d="M24 34c0-12 7-20 16-20s16 8 16 20c0 4-1 8-3 11H27c-2-3-3-7-3-11z" fill="#2a1d1a"/><circle cx="40" cy="34" r="12" fill="#d9b796"/><path d="M12 80c3-17 14-25 28-25s25 8 28 25z" fill="#5b2f2a"/><path d="M30 58l10 10 10-10" fill="none" stroke="#c9a45c" stroke-width="3"/></svg>`,
)}`;
