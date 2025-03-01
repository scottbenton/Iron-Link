import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import { Box, BoxProps } from "@chakra-ui/react";

import { ClockSegment } from "./ClockSegment";

export type ClockSize = "small" | "medium" | "large";

const sizes: Record<ClockSize, number> = {
  small: 60,
  medium: 80,
  large: 120,
};

export interface ClockCircleProps extends Omit<BoxProps, "onClick"> {
  segments: number;
  value: number;
  onClick?: () => void;
  size?: ClockSize;
}

export function ClockCircle(props: ClockCircleProps) {
  const { segments, value, onClick, size = "medium", ...boxProps } = props;

  const t = useDataswornTranslations();

  return (
    <Box
      as={onClick ? "button" : "div"}
      aria-label={t(
        "clock-aria-label",
        "Clock with {{segments}} segments. {{value}} filled.",
        { segments, value },
      )}
      borderRadius="full"
      onClick={onClick}
      color="fg.muted"
      {...boxProps}
    >
      <Box asChild stroke="gray.500">
        <svg width={sizes[size]} height={sizes[size]} viewBox="-2 -2 104 104">
          {Array.from({ length: segments }).map((_, index) => (
            <ClockSegment
              key={index}
              index={index}
              segments={segments}
              filled={value}
            />
          ))}
        </svg>
      </Box>
    </Box>
  );
}
