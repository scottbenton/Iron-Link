import { ReactNode } from "react";

import { Text } from "ui/components/Text";
import { VisuallyHidden } from "ui/components/VisuallyHidden";
import { Box, HStack } from "ui/primitives";

interface SecondScreenMeterValueProps {
  icon: ReactNode;
  /** The icon's colour: red for health, blue for spirit. */
  tone: "danger" | "info";
  label: string;
  value: number;
}

/**
 * A meter on a second screen card, as a term and its value inside the card's
 * `<dl>`. The icon stands in for the name; screen readers hear the name.
 */
export function SecondScreenMeterValue(props: SecondScreenMeterValueProps) {
  const { icon, tone, label, value } = props;
  return (
    <HStack gap="1">
      <Box
        as="dt"
        display="flex"
        // Literal tokens, so Panda finds them at build time.
        color={tone === "danger" ? "danger.fg" : "info.fg"}
        fontSize="xl"
      >
        {icon}
        <VisuallyHidden>{label}</VisuallyHidden>
      </Box>
      <Text as="dd" variant="h3" css={{ margin: 0 }}>
        {value}
      </Text>
    </HStack>
  );
}
