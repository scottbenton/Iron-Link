import { useLayoutTranslations } from "@/hooks/i18n/useLayoutTranslations";
import { pageConfig } from "@/pages/pageConfig";
import { DicesIcon, EarthIcon, NotebookPen } from "lucide-react";

export interface NavItemConfig {
  label: string;
  path: string;
  pathMatch: string;
  icon: typeof DicesIcon;
}

export function useNavItems(): NavItemConfig[] {
  const t = useLayoutTranslations();

  const isAuthenticated = true;

  if (isAuthenticated) {
    return [
      {
        label: t("nav.games", "Games"),
        path: pageConfig.gameSelect,
        pathMatch: "/games/*?",
        icon: DicesIcon,
      },
      {
        label: t("nav.worlds", "Worlds"),
        path: pageConfig.worldSelect,
        pathMatch: "/worlds/*?",
        icon: EarthIcon,
      },
      {
        label: t("nav.homebrew", "Homebrew"),
        path: pageConfig.homebrewSelect,
        pathMatch: "/homebrew/*?",
        icon: NotebookPen,
      },
    ];
  } else {
    return [];
  }
}
