import { css } from "styled-system/css";

import { GameLog } from "../../game/GameLog";
import { PlaySheet } from "./usePlaySheet";

/** The game log, filling the height it is given. */
export function Log(props: { sheet: PlaySheet }) {
  const { sheet } = props;
  return (
    <div className={logStyles}>
      <GameLog entries={sheet.entries} onSend={sheet.send} />
    </div>
  );
}

const logStyles = css({
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  height: "100%",
  minHeight: 0,
});
