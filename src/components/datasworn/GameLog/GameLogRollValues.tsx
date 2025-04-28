import { D6Icon } from "@/assets/D6Icon";
import { D10Icon } from "@/assets/D10Icon";
import { SkullIcon } from "@/assets/GameTypeIcon/SkullIcon";
import { Box, Separator, Span, Text } from "@chakra-ui/react";

import { TrackTick } from "../Track/TrackTick";

export interface GameLogRollValuesProps {
  d10Results?: number[] | number;
  d6Result?: {
    action: number;
    modifier?: number;
    adds?: number;
    rollTotal: number;
  };
  progress?: number;
  fixedResult?: {
    title: string;
    value: string | number;
  };
  cursedResult?: number;
  crossOutD6?: boolean;
  crossOutD6Value?: boolean;
}
export function GameLogRollValues(props: GameLogRollValuesProps) {
  const {
    progress,
    d10Results,
    d6Result,
    crossOutD6,
    crossOutD6Value,
    fixedResult,
    cursedResult,
  } = props;

  return (
    <>
      <Box>
        {d6Result && (
          <Box
            display={"flex"}
            alignItems={"center"}
            justifyContent={"space-between"}
            position={"relative"}
          >
            {crossOutD6 && (
              <Box
                position={"absolute"}
                height={"1px"}
                width={"100%"}
                background="border"
                top={"50%"}
              />
            )}
            <D6Icon />
            <Text ml={2} color={"fg.muted"}>
              <Span
                {...(d6Result.action === 1
                  ? {
                      borderRadius: "sm",
                      borderColor: "border.error",
                      borderWidth: 1,
                      px: 0.5,
                    }
                  : {})}
                {...(crossOutD6Value ? { textDecoration: "line-through" } : {})}
              >
                {d6Result.action}
              </Span>
              {crossOutD6Value ? " (0)" : ""}
              {d6Result.modifier ? ` + ${d6Result.modifier}` : ""}

              {d6Result.adds ? ` + ${d6Result.adds}` : ""}
              {d6Result.modifier || d6Result.adds
                ? ` = ${
                    d6Result.rollTotal > 10 ? "10 (Max)" : d6Result.rollTotal
                  }`
                : ""}
            </Text>
          </Box>
        )}
        {typeof progress === "number" && (
          <Box
            display={"flex"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Box
              m={"1px"}
              borderRadius="sm"
              borderWidth={1}
              display="flex"
              alignItems={"center"}
              justifyContent={"center"}
              borderColor={"fg.muted"}
            >
              <TrackTick size={5} value={4} />
            </Box>
            <Text ml={1} color={"fg"}>
              {progress}
            </Text>
          </Box>
        )}
        {fixedResult && (
          <Box
            display={"flex"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Text color={"fg.muted"}>
              {fixedResult.title}: {fixedResult.value}
            </Text>
          </Box>
        )}
        {d10Results && (
          <Box
            display={"flex"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <D10Icon />
            <Text ml={1} color={"fg.muted"}>
              {Array.isArray(d10Results) ? d10Results.join(", ") : d10Results}
            </Text>
          </Box>
        )}
        {cursedResult && (
          <Box
            display={"flex"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <SkullIcon color="#7ccf00" />
            <Text ml={1} color={"fg.muted"}>
              {cursedResult}
            </Text>
          </Box>
        )}
      </Box>
      <Separator
        orientation={"vertical"}
        borderColor="border.emphasized"
        size="md"
        alignSelf={"stretch"}
        mx={4}
      />
    </>
  );
}
