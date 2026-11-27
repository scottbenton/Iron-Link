import { ReactNode } from "react";

import { useHeadingComponent } from "ui/components/HeadingOffset";
import { Text } from "ui/components/Text";
import { Stack } from "ui/primitives";

export interface DataswornTreeGroupProps {
  // The rules package's name, shown when the list holds more than one.
  title?: string;
  children: ReactNode;
}

// One rules package's categories in a list of moves or oracles.
export function DataswornTreeGroup(props: DataswornTreeGroupProps) {
  const { title, children } = props;
  const Heading = useHeadingComponent(3);
  return (
    <Stack gap="1">
      {title && (
        <Text
          variant="eyebrow"
          color="muted"
          as={Heading}
          css={{ paddingInline: "3", paddingBlockStart: "2" }}
        >
          {title}
        </Text>
      )}
      {children}
    </Stack>
  );
}
