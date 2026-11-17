import { useLocation } from "react-router";

import { LinkComponent } from "components/LinkComponent";

import { NavRailItemView } from "./NavRailItemView";
import { NavRouteConfig } from "./navRoutes";

export function NavRailItem(props: NavRouteConfig) {
  const { Logo, title, checkIsSelected, href } = props;

  const { pathname } = useLocation();

  const isSelected = checkIsSelected(pathname);

  return (
    <NavRailItemView
      component={LinkComponent}
      href={href}
      icon={<Logo />}
      label={title}
      isSelected={isSelected}
    />
  );
}
