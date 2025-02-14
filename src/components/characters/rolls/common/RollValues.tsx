import { Box, Divider, Typography } from "@mui/material";

import { D6Icon } from "assets/D6Icon";
import { D10Icon } from "assets/D10Icon";
import { SkullIcon } from "assets/SkullIcon";

import { ProgressTrackTick } from "components/datasworn/ProgressTrack/ProgressTrackTick";

export interface RollValuesProps {
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
  isExpanded: boolean;
}
export function RollValues(props: RollValuesProps) {
  const {
    progress,
    d10Results,
    d6Result,
    crossOutD6,
    crossOutD6Value,
    fixedResult,
    isExpanded,
    cursedResult,
  } = props;

  if (!isExpanded) {
    return null;
  }

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
                bgcolor={(theme) => theme.palette.grey[400]}
                top={"50%"}
              />
            )}
            <D6Icon />
            <Typography ml={1} color={"grey.200"}>
              <Box
                component={"span"}
                sx={[
                  d6Result.action === 1
                    ? {
                        borderRadius: 1,
                        borderColor: "primary.light",
                        borderWidth: 1,
                        borderStyle: "solid",
                        px: 0.5,
                      }
                    : {},
                  crossOutD6Value
                    ? {
                        textDecoration: "line-through",
                      }
                    : {},
                ]}
              >
                {d6Result.action}
              </Box>
              {crossOutD6Value ? " (0)" : ""}
              {d6Result.modifier ? ` + ${d6Result.modifier}` : ""}

              {d6Result.adds ? ` + ${d6Result.adds}` : ""}
              {d6Result.modifier || d6Result.adds
                ? ` = ${
                    d6Result.rollTotal > 10 ? "10 (Max)" : d6Result.rollTotal
                  }`
                : ""}
            </Typography>
          </Box>
        )}
        {typeof progress === "number" && (
          <Box
            display={"flex"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Box
              sx={(theme) => ({
                border: `1px solid ${theme.palette.grey[400]}`,
                borderRadius: 1,
                m: "1px",
              })}
            >
              <ProgressTrackTick size={20} value={4} />
            </Box>
            <Typography ml={1} color={"grey.200"}>
              {progress}
            </Typography>
          </Box>
        )}
        {fixedResult && (
          <Box
            display={"flex"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Typography color={"grey.200"}>
              {fixedResult.title}: {fixedResult.value}
            </Typography>
          </Box>
        )}
        {d10Results && (
          <Box
            display={"flex"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <D10Icon />
            <Typography ml={1} color={"grey.200"}>
              {Array.isArray(d10Results) ? d10Results.join(", ") : d10Results}
            </Typography>
          </Box>
        )}
        {cursedResult && (
          <Box
            display={"flex"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <SkullIcon
              sx={(theme) => ({
                color:
                  cursedResult === 10
                    ? theme.palette.cursed.main
                    : theme.palette.grey[300],
              })}
            />
            <Typography ml={1} color={"grey.200"}>
              {cursedResult}
            </Typography>
          </Box>
        )}
      </Box>
      <Divider
        orientation={"vertical"}
        sx={(theme) => ({
          alignSelf: "stretch",
          borderColor: theme.palette.grey[400],
          height: "auto",
          mx: 2,
        })}
      />
    </>
  );
}
