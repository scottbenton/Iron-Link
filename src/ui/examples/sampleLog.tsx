import { CharacterPortrait } from "../game/CharacterPortrait";
import type { GameLogAuthor, GameLogEntry } from "../game/GameLog";
import type { SampleCharacter } from "../stories/fixtures/characters";
import { sampleCharacters } from "../stories/fixtures/characters";
import { sampleRolls } from "../stories/fixtures/rolls";

export function characterAuthor(
  character: SampleCharacter,
  isYou = false,
): GameLogAuthor {
  return {
    name: character.name,
    writtenBy: character.playerName,
    isYou,
    portrait: (
      <CharacterPortrait
        name={character.name}
        colorSeed={character.colorSeed}
        size="sm"
        decorative
      />
    ),
  };
}

const [kira, orrin] = sampleCharacters;
const guide: GameLogAuthor = { name: "Jamie", writtenBy: "Guide" };
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

/** A short session to start the playable example from. */
export const gameLogEntries: GameLogEntry[] = [
  {
    id: "start-1",
    kind: "message",
    author: guide,
    timestamp: minutesAgo(30),
    message:
      "The airlock hisses open onto the derelict. Lights flicker somewhere deep inside.",
  },
  {
    id: "start-2",
    kind: "roll",
    author: characterAuthor(kira, true),
    timestamp: minutesAgo(26),
    roll: sampleRolls.faceDangerStrongHit,
  },
  {
    id: "start-3",
    kind: "message",
    author: characterAuthor(orrin),
    timestamp: minutesAgo(20),
    message: "I'll keep watch at the hatch while you look around.",
  },
];
