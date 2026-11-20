import { useState } from "react";

import { css } from "styled-system/css";

import { sampleCharacters } from "../../docs/fixtures/characters";
import { GameLog } from "../../game/GameLog";
import type { GameLogEntry } from "../../game/GameLog";
import { characterAuthor, gameLogEntries } from "./sampleLog";

const logScreenStyles = css({
  flex: "1 1 auto",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
});

export function LogScreen() {
  const [entries, setEntries] = useState<GameLogEntry[]>(gameLogEntries);
  return (
    <div className={logScreenStyles}>
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
    </div>
  );
}
