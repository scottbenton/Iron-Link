import { useTranslation } from "react-i18next";

import {
  CardsIcon,
  ChatsCircleIcon,
  DiceFiveIcon,
  FlagBannerIcon,
  HandFistIcon,
  IdentificationCardIcon,
  MonitorIcon,
  UsersThreeIcon,
} from "ui/icons";
import type { LayoutSection } from "ui/layout";

import { useSecondScreenFeature } from "hooks/advancedFeatures/useSecondScreenFeature";

import { ReferenceTabs } from "stores/appState.store";
import type {
  CharacterSheetSection,
  GameOverviewSection,
} from "stores/gamePageLayout.store";

export interface ColumnSection<Id extends string> extends LayoutSection {
  id: Id;
}

// The game page columns' own tabs. The columns render them as tabs, and a
// collapsed column's rail shows them as buttons, so both read these lists.

export function useCharacterSheetSections(): ColumnSection<CharacterSheetSection>[] {
  const { t } = useTranslation();
  return [
    {
      id: "overview",
      title: t("character.character-sidebar.overview", "Overview"),
      icon: <IdentificationCardIcon />,
    },
    {
      id: "assets",
      title: t("character.character-sidebar.assets", "Assets"),
      icon: <CardsIcon />,
    },
    {
      id: "tracks",
      title: t("character.character-sidebar.tracks", "Tracks"),
      icon: <FlagBannerIcon />,
    },
  ];
}

export function useGameOverviewSections(): ColumnSection<GameOverviewSection>[] {
  const { t } = useTranslation();
  return [
    {
      id: "characters",
      title: t("character.character-sidebar.characters", "Characters"),
      icon: <UsersThreeIcon />,
    },
    {
      id: "assets",
      title: t("character.character-sidebar.assets", "Assets"),
      icon: <CardsIcon />,
    },
    {
      id: "tracks",
      title: t("character.character-sidebar.tracks", "Tracks"),
      icon: <FlagBannerIcon />,
    },
  ];
}

export function useReferenceSections(): ColumnSection<ReferenceTabs>[] {
  const { t } = useTranslation();
  const showSecondScreen = useSecondScreenFeature();
  const sections: ColumnSection<ReferenceTabs>[] = [
    {
      id: ReferenceTabs.Moves,
      title: t("character.reference-sidebar-moves", "Moves"),
      icon: <HandFistIcon />,
    },
    {
      id: ReferenceTabs.Oracles,
      title: t("character.reference-sidebar-oracles", "Oracles"),
      icon: <DiceFiveIcon />,
    },
    {
      id: ReferenceTabs.GameLog,
      title: t("character.reference-sidebar-game-log", "Game Log"),
      icon: <ChatsCircleIcon />,
    },
  ];
  if (showSecondScreen) {
    sections.push({
      id: ReferenceTabs.SecondScreen,
      title: t("character.reference-sidebar-second-screen-tab", "Screen"),
      icon: <MonitorIcon />,
    });
  }
  return sections;
}
