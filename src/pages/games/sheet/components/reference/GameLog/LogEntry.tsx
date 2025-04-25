import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useUID } from "@/stores/auth.store";
import { useGameCharactersStore } from "@/stores/gameCharacters.store";
import { useGameLogStore } from "@/stores/gameLog.store";
import { useUserName } from "@/stores/users.store";
import { Box, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { memo } from "react";

import { LogEntryTimestamp } from "./LogEntryTimestamp";

dayjs.extend(relativeTime);

export interface LogEntryProps {
  logId: string;
  priorLogId?: string;
}

export const LogEntry = memo(
  function LogEntryUnmemoized(props: LogEntryProps) {
    const { logId, priorLogId } = props;
    const log = useGameLogStore((store) => store.logs[logId]);
    const priorLogTime = useGameLogStore((store) =>
      priorLogId ? store.logs[priorLogId].timestamp : undefined,
    );

    const t = useGameTranslations();

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

    if (!log) {
      return null;
    }

    return (
      <Box
        p={2}
        display={"flex"}
        flexDirection={"column"}
        alignItems={isYourEntry ? "flex-end" : "flex-start"}
      >
        <Text>{rollerName}</Text>
        <div>{log.result}</div>
        <Text color={"fg.muted"} fontSize="sm">
          <LogEntryTimestamp timestamp={log.timestamp} />
        </Text>
      </Box>
    );
  },
  (prev, next) => {
    return prev.logId === next.logId && prev.priorLogId === next.priorLogId;
  },
);
