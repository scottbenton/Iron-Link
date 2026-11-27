import { ReactNode } from "react";

import { Text } from "ui/components/Text";
import { Stack } from "ui/primitives";

/** One headed section of the policy. */
export function PolicySection(props: { title: string; children: ReactNode }) {
  const { title, children } = props;
  return (
    <Stack as="section" gap="2">
      <Text variant="h3" as="h2">
        {title}
      </Text>
      {children}
    </Stack>
  );
}
