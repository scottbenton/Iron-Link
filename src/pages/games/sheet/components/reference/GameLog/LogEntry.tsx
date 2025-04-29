import { PortraitAvatar } from "@/components/common/PortraitAvatar";
import { GameLogCard } from "@/components/datasworn/GameLog/GameLogCard";
import { NormalRollActions } from "@/components/datasworn/GameLog/NormalRollActions";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useGameCharactersStore } from "@/stores/gameCharacters.store";
import { useGameLogStore } from "@/stores/gameLog.store";
import { useUserName } from "@/stores/users.store";
import { Span, Timeline } from "@chakra-ui/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { memo } from "react";

dayjs.extend(relativeTime);

export interface LogEntryProps {
  logId: string;
  fromTime: Date;
}

export const LogEntry = memo(
  function LogEntryUnmemoized(props: LogEntryProps) {
    const { logId, fromTime } = props;
    const log = useGameLogStore((store) => store.logs[logId]);

    const t = useGameTranslations();

    const logCharacterId = log.characterId;
    const logCharacterName = useGameCharactersStore((state) =>
      logCharacterId ? state.characters[logCharacterId].name : undefined,
    );
    const logCreatorName = useUserName(log.uid);

    let rollerName = "";
    if (logCharacterName === undefined) {
      rollerName = logCreatorName;
    } else if (logCharacterName === null) {
      rollerName = logCharacterName ?? t("common.loading", "Loading");
    } else {
      rollerName = logCharacterName;
    }

    const portraitSettings = useGameCharactersStore((state) =>
      log.characterId ? state.characters[log.characterId].profileImage : null,
    );

    if (!log) {
      return null;
    }

    return (
      <Timeline.Item key={logId}>
        <Timeline.Connector>
          <Timeline.Separator />
          <Timeline.Indicator>
            <PortraitAvatar
              size={32}
              rounded={"full"}
              name={rollerName}
              characterId={log.characterId ?? ""}
              portraitSettings={portraitSettings ?? undefined}
            />
          </Timeline.Indicator>
        </Timeline.Connector>
        <Timeline.Content>
          <Timeline.Title>
            <Span fontWeight="bold">{rollerName}</Span>
            {dayjs(log.timestamp).from(fromTime)}
          </Timeline.Title>
          <GameLogCard
            ml={-4}
            log={log}
            actions={<NormalRollActions roll={log} />}
          />
        </Timeline.Content>
      </Timeline.Item>
    );
  },
  (prev, next) => {
    return prev.logId === next.logId && prev.fromTime === next.fromTime;
  },
);
