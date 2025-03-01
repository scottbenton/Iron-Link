import { Box, BoxProps } from "@chakra-ui/react";

import { NavItem } from "./NavItem";
import { useNavItems } from "./useNavItems";

export function NavItems(props: BoxProps) {
  const navItems = useNavItems();

  return (
    <Box as="nav" display="flex" alignItems="center" gap={1} {...props}>
      {navItems.map((item) => (
        <NavItem key={item.path} config={item} />
      ))}
    </Box>
  );
}
