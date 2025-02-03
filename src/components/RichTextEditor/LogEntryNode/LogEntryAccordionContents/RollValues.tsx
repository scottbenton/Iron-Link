import { Box, Typography } from "@mui/material";

import { D6Grey } from "assets/D6Grey";
import { D10Grey } from "assets/D10Grey";

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
  crossOutD6?: boolean;
  crossOutD6Value?: boolean;
}
export function RollValues(props: RollValuesProps) {
  const {
    progress,
    d10Results,
    d6Result,
    crossOutD6,
    crossOutD6Value,
    fixedResult,
  } = props;

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {d6Result && (
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"flex-start"}
          position={"relative"}
        >
          {crossOutD6 && (
            <Box
              position={"absolute"}
              height={"1px"}
              width={"100%"}
              bgcolor={(theme) =>
                theme.palette.mode === "dark"
                  ? theme.palette.grey[400]
                  : theme.palette.grey[600]
              }
              top={"50%"}
            />
          )}
          <D6Grey />
          <Typography ml={1} color={"textSecondary"}>
            <Box
              component={"span"}
              sx={[
                d6Result.action === 1
                  ? {
                      borderRadius: 1,
                      borderColor: "primary.main",
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
          justifyContent={"flex-start"}
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
          <Typography ml={1} color={"textSecondary"}>
            {progress}
          </Typography>
        </Box>
      )}
      {fixedResult && (
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"flex-start"}
        >
          <Typography color={"textSecondary"}>
            {fixedResult.title}: {fixedResult.value}
          </Typography>
        </Box>
      )}
      {d10Results && (
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"flex-start"}
        >
          <D10Grey id={"test"} />
          <Typography ml={1} color={"textSecondary"}>
            {Array.isArray(d10Results) ? d10Results.join(", ") : d10Results}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
