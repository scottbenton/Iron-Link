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
    portrait: <CharacterPortrait name={character.name} size="sm" decorative />,
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
  {
    id: "start-4",
    kind: "roll",
    author: characterAuthor(orrin),
    timestamp: minutesAgo(18),
    roll: sampleRolls.secureAnAdvantageWeakHit,
  },
  {
    id: "start-5",
    kind: "roll",
    author: characterAuthor(kira, true),
    timestamp: minutesAgo(12),
    roll: sampleRolls.spaceSighting,
  },
  {
    id: "start-6",
    kind: "message",
    author: characterAuthor(kira, true),
    timestamp: minutesAgo(11),
    message: "Kira follows the flicker down the spine corridor.",
  },
];
