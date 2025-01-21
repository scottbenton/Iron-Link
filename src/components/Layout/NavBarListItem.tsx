import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import { LinkComponent } from "components/LinkComponent";

import { NavRouteConfig } from "./navRoutes";

export function NavBarListItem(props: NavRouteConfig) {
  const { title, Logo, href } = props;

  return (
    <ListItem disablePadding>
      <ListItemButton LinkComponent={LinkComponent} href={href}>
        <ListItemIcon>
          <Logo />
        </ListItemIcon>
        <ListItemText primary={title} />
      </ListItemButton>
    </ListItem>
  );
}
