import { PropsWithChildren } from "react";

import { Divider } from "ui/components/Divider";
import { Text } from "ui/components/Text";
import { Box, Flex } from "ui/primitives";

import { ReferenceShareButton } from "../ReferenceShareButton";

export interface ReferenceRulesGroupProps {
  id: string;
  title: string;
  basePath: string;
}

// One group of rules (stats, meters and so on) under an h2 that a link can
// open straight to, with a button to share that link.
export function ReferenceRulesGroup(
  props: PropsWithChildren<ReferenceRulesGroupProps>,
) {
  const { id, title, basePath, children } = props;
  return (
    <Box as="section" aria-labelledby={`${id}-heading`} marginBlockEnd="8">
      <Flex
        alignItems="center"
        justifyContent="space-between"
        gap="2"
        flexWrap="wrap"
        marginBlockEnd="2"
      >
        <Text id={`${id}-heading`} variant="h3" as="h2">
          {/* The anchor is on the heading's span so the page scrolls to it. */}
          <Box as="span" id={id} scrollMarginTop="4">
            {title}
          </Box>
        </Text>
        <ReferenceShareButton path={`${basePath}#${id}`} name={title} />
      </Flex>
      <Divider />
      <Box marginBlockStart="4">{children}</Box>
    </Box>
  );
}
