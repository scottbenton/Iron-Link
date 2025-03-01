import { Button, ButtonProps, Icon } from "@chakra-ui/react";
import { Link, useRoute } from "wouter";

import { NavItemConfig } from "./useNavItems";

export interface NavItemProps {
  config: NavItemConfig;
  showIcon?: boolean;
}

export function NavItem(props: ButtonProps & NavItemProps) {
  const { config, showIcon, ...buttonProps } = props;
  const { label, path, pathMatch, icon: NavIcon } = config;

  const isSelected = useRoute(pathMatch)[0];

  return (
    <Button
      asChild
      variant={isSelected ? "subtle" : "ghost"}
      colorPalette="gray"
      {...buttonProps}
    >
      <Link href={path}>
        {showIcon && (
          <Icon asChild mr={1}>
            <NavIcon />
          </Icon>
        )}
        {label}
      </Link>
    </Button>
  );
}
