import { Select } from "@/components/common/TextField";
import { ClockCircle } from "@/components/datasworn/Clocks/ClockCircle";
import { askTheOracleEnumMap } from "@/data/askTheOracle";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useRollOracleAndAddToLog } from "@/hooks/useRollOracleAndAddToLog";
import { AskTheOracle, TrackStatus } from "@/repositories/tracks.repository";
import { IClock } from "@/services/tracks.service";
import { useSetAnnouncement } from "@/stores/appState.store";
import { useTracksStore } from "@/stores/tracks.store";
import { Box, BoxProps, Button } from "@chakra-ui/react";
import { DicesIcon } from "lucide-react";
import { useCallback, useMemo } from "react";

export interface TrackClockProps extends BoxProps {
  canEdit: boolean;
  clockId: string;
  clock: IClock;
}

export function TrackClock(props: TrackClockProps) {
  const { canEdit, clockId, clock, ...boxProps } = props;
  const { label, oracleKey, value, segments, status } = clock;

  const t = useGameTranslations();
  const announce = useSetAnnouncement();

  const updateClockOracleKey = useTracksStore(
    (store) => store.updateClockSelectedOracle,
  );
  const handleSelectedOracleChange = useCallback(
    (oracleKey: AskTheOracle) => {
      updateClockOracleKey(clockId, oracleKey).catch(() => {});
    },
    [clockId, updateClockOracleKey],
  );

  const rollOracle = useRollOracleAndAddToLog();
  const updateClockValue = useTracksStore(
    (store) => store.updateClockFilledSegments,
  );
  const handleProgressionRoll = useCallback(() => {
    const oracleId =
      askTheOracleEnumMap[oracleKey ?? AskTheOracle.AlmostCertain]._id;
    const { result } = rollOracle(oracleId);

    if (result?.result === "Yes") {
      const add = result.match ? 2 : 1;

      updateClockValue(clockId, value + add).catch(() => {});
      announce(
        t(
          "character.character-sidebar.tracks-clock-roll-progress-announcement-yes",
          "Clock {{clockLabel}} progressed by {{add}} segment(s) for a total of {{value}} of {{total}} segments",
          {
            clockLabel: label,
            add,
            value: Math.min(value + add, segments),
            total: segments,
          },
        ),
      );
    } else {
      announce(
        t(
          "character.character-sidebar.tracks-clock-roll-progress-announcement-no",
          "Clock {{clockLabel}} did not progress",
          { clockLabel: label },
        ),
      );
    }
  }, [
    label,
    value,
    segments,
    oracleKey,
    announce,
    rollOracle,
    clockId,
    t,
    updateClockValue,
  ]);

  const onValueChange = useMemo(() => {
    if (!canEdit || status === TrackStatus.Completed) {
      return undefined;
    }
    return () => {
      const newSegments = value >= segments ? 0 : value + 1;
      updateClockValue(clockId, newSegments).catch(() => {
        announce(
          t(
            "character.character-sidebar.tracks-clock-roll-progress-announcement-manual",
            "Manually incremented clock {{clockLabel}} to {{value}} of {{total}} segments",
            {
              clockLabel: clock.label,
              value: newSegments,
              total: clock.segments,
            },
          ),
        );
        updateClockValue(clockId, newSegments).catch(() => {});
      });
    };
  }, [
    canEdit,
    status,
    clockId,
    clock,
    updateClockValue,
    announce,
    t,
    segments,
    value,
  ]);

  return (
    <Box display={"flex"} alignItems={"flex-end"} gap={4} {...boxProps}>
      <Box
        display={"flex"}
        flexDirection={"column"}
        gap={1}
        alignItems={"stretch"}
        minWidth={160}
      >
        <Select
          label={t(
            "character.character-sidebar.tracks-clock-oracle-table",
            "Oracle Table",
          )}
          disabled={!canEdit || clock.status === TrackStatus.Completed}
          value={clock.oracleKey ?? AskTheOracle.Likely}
          onChange={(oracle) =>
            handleSelectedOracleChange(oracle as AskTheOracle)
          }
          options={Object.entries(askTheOracleEnumMap).map(([key, value]) => ({
            label: value.name,
            value: key,
          }))}
        />
        {canEdit && (
          <Button
            variant="subtle"
            onClick={() => handleProgressionRoll()}
            disabled={
              clock.status === TrackStatus.Completed ||
              clock.value >= clock.segments
            }
          >
            {t("tracks-clock-roll-progress", "Roll Progress")}
            <DicesIcon />
          </Button>
        )}
      </Box>
      <ClockCircle
        value={clock.value}
        segments={clock.segments}
        onClick={onValueChange}
      />
    </Box>
  );
}
