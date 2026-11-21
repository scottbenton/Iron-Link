import { useTheme } from "@mui/material";

import { wedgePath } from "ui/game/Clock/clockGeometry";

export interface ClockSegmentProps {
  index: number;
  segments: number;
  filled: number;
}

export function ClockSegment(props: ClockSegmentProps) {
  const { index, segments, filled } = props;

  const isFilled = index < filled;

  const theme = useTheme();

  return (
    <path
      d={wedgePath(index, segments)}
      strokeWidth={4}
      fill={isFilled ? theme.palette.grey[300] : theme.palette.background.paper}
    />
  );
}
