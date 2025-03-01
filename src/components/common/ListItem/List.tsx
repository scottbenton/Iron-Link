import { Box, BoxProps } from "@chakra-ui/react";

export function List(props: BoxProps) {
  return <Box as="ul" listStyle="none" {...props} />;
}
