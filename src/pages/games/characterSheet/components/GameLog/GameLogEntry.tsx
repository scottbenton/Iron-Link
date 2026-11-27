import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { ScreenReaderOnly } from "components/ScreenReaderOnly";
import { RollSnackbar } from "components/characters/rolls/RollSnackbar";

import { getGameLogHeading } from "ui/game/GameLog/gameLogHeading";
import { getDefaultGameLogStrings } from "ui/game/GameLog/gameLogStrings";

import { useUID } from "stores/auth.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useUserName } from "stores/users.store";

import { IGameLog, LogType } from "services/gameLog.service";

import { GameLogMessage } from "./GameLogMessage";
import { NormalRollActions } from "./NormalRollActions";
import { getGameLogAuthor } from "./gameLogAuthor";

export interface GameLogEntryProps {
  logId: string;
  log: IGameLog;
}

export function GameLogEntry(props: GameLogEntryProps) {
  const { logId, log } = props;
  const { t } = useTranslation();

  const uid = useUID();

  const logCharacterId = log.characterId;
  const logCharacterName = useGameCharactersStore((state) =>
    logCharacterId ? state.characters[logCharacterId]?.name : undefined,
  );
  const logCharacterOwnerId = useGameCharactersStore((state) =>
    logCharacterId ? state.characters[logCharacterId]?.uid : undefined,
  );
  const logCreatorName = useUserName(log.uid);

  const gameLogStrings = getDefaultGameLogStrings(t);
  const author = getGameLogAuthor({
    log,
    uid,
    characterName: logCharacterName,
    characterOwnerId: logCharacterOwnerId,
    creatorName: logCreatorName,
    loadingName: t("common.loading", "Loading"),
    strings: gameLogStrings,
  });
  const { name: rollerName, writtenBy, isYou: isYourEntry } = author;

  const getLogTimeString = (d: Date) => {
    return d.toLocaleString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const timeString = getLogTimeString(log.timestamp);

  // Who wrote the entry and when, read with it as one piece of text; the
  // name and time shown around it are hidden from screen readers.
  // The app's log shows no Guide only mark yet (changes.md row 39).
  const heading = `${getGameLogHeading({ author }, timeString, gameLogStrings)}.`;

  return (
    <Box
      component={"li"}
      p={2}
      display={"flex"}
      flexDirection={"column"}
      alignItems={isYourEntry ? "flex-end" : "flex-start"}
    >
      <Typography aria-hidden>{rollerName}</Typography>
      {writtenBy && (
        <Typography color={"textSecondary"} variant={"caption"} aria-hidden>
          {writtenBy}
        </Typography>
      )}
      {log.logType === LogType.ROLL && (
        <RollSnackbar
          actions={<NormalRollActions rollId={logId} roll={log} />}
          rollId={logId}
          roll={log}
          isExpanded
          summaryPrefix={heading}
        />
      )}
      {log.logType === LogType.MESSAGE && (
        <>
          <ScreenReaderOnly>{heading}</ScreenReaderOnly>
          <GameLogMessage message={log} />
        </>
      )}
      <Typography color={"textSecondary"} variant={"caption"} aria-hidden>
        {timeString}
      </Typography>
    </Box>
  );
}
