import { useLayoutTranslations } from "@/hooks/i18n/useLayoutTranslations";
import { IconButton } from "@chakra-ui/react";
import { MenuIcon } from "lucide-react";

import {
  DrawerActionTrigger,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { NavItem } from "./NavItem";
import { useNavItems } from "./useNavItems";

export function NavDrawer() {
  const t = useLayoutTranslations();

  const navItems = useNavItems();

  return (
    <DrawerRoot placement="start">
      <DrawerBackdrop />
      <DrawerTrigger asChild>
        <IconButton
          mr={1}
          aria-label={t("menu", "Menu")}
          colorPalette="gray"
          variant="ghost"
        >
          <MenuIcon />
        </IconButton>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerCloseTrigger />
        <DrawerHeader>
          <DrawerTitle>{t("drawer.title", "Navigation")}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody display="flex" flexDirection="column" w="100%">
          {navItems.map((item) => (
            <DrawerActionTrigger asChild key={item.path}>
              <NavItem
                size="xl"
                config={item}
                justifyContent={"flex-start"}
                fontWeight={600}
                showIcon
              />
            </DrawerActionTrigger>
          ))}
        </DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  );
}
