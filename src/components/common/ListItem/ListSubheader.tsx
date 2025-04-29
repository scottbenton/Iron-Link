import { Box, BoxProps } from "@chakra-ui/react";

export function ListSubheader(props: BoxProps) {
  return (
    <Box
      as="li"
      bgColor="bg.emphasized"
      px={4}
      py={1}
      borderBottomWidth={1}
      borderBottomColor={"border.emphasized"}
      fontFamily={"heading"}
      {...props}
    />
  );
}
