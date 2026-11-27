import { PropsWithChildren } from "react";

import { Text } from "ui/components/Text";
import { Box } from "ui/primitives";

export interface ReferenceRuleEntryProps {
  label: string;
  detail?: string;
  headingAs?: "h3" | "h4";
}

// One stat, meter, impact or track: its name, an optional line of facts
// (a meter's range, an impact's effects) and its rules text.
export function ReferenceRuleEntry(
  props: PropsWithChildren<ReferenceRuleEntryProps>,
) {
  const { label, detail, headingAs = "h3", children } = props;
  return (
    <Box marginBlockEnd="4">
      <Text as={headingAs} weight="semibold">
        <Box as="span" textTransform="capitalize">
          {label}
        </Box>
      </Text>
      {detail && (
        <Text variant="bodySm" color="muted">
          {detail}
        </Text>
      )}
      {children}
    </Box>
  );
}
