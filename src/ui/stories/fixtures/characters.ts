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
    playerName: "Parham",
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
