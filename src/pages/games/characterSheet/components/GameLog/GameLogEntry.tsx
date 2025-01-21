import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { RollSnackbar } from "components/characters/rolls/RollSnackbar";

import { useUID } from "stores/auth.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useUserName } from "stores/users.store";

import { IGameLog } from "services/gameLog.service";

import { NormalRollActions } from "./NormalRollActions";

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
    logCharacterId ? state.characters[logCharacterId].name : undefined,
  );
  const logCreatorName = useUserName(log.uid);

  const isYourEntry = log.uid === uid;

  let rollerName = "";
  if (logCharacterName === undefined) {
    rollerName = logCreatorName;
  } else if (logCharacterName === null) {
    rollerName = logCharacterName ?? t("common.loading", "Loading");
  } else {
    rollerName = logCharacterName;
  }

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

  return (
    <Box
      p={2}
      display={"flex"}
      flexDirection={"column"}
      alignItems={isYourEntry ? "flex-end" : "flex-start"}
    >
      <Typography>{rollerName}</Typography>
      <RollSnackbar
        actions={<NormalRollActions rollId={logId} roll={log} />}
        rollId={logId}
        roll={log}
        isExpanded
      />
      <Typography color={"textSecondary"} variant={"caption"}>
        {getLogTimeString(log.timestamp)}
      </Typography>
    </Box>
  );
}
