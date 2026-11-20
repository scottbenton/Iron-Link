import { useState } from "react";

import { sampleCharacters } from "../../docs/fixtures/characters";
import { GameLog } from "../../game/GameLog";
import type { GameLogEntry } from "../../game/GameLog";
import { characterAuthor, gameLogEntries } from "./sampleLog";

/** The game log with its sample entries, sending as the first character. */
export function GameLogPanel() {
  const [entries, setEntries] = useState<GameLogEntry[]>(gameLogEntries);
  return (
    <GameLog
      entries={entries}
      onSend={(message) =>
        setEntries((current) => [
          ...current,
          {
            kind: "message",
            id: `message-${current.length}`,
            author: characterAuthor(sampleCharacters[0], true),
            timestamp: new Date(),
            message,
          },
        ])
      }
    />
  );
}
