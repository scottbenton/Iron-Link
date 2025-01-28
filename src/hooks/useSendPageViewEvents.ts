import { useEffect } from "react";

import {
  AnalyticsService,
  LoggerCategory,
  LoggerVerb,
} from "services/analytics.service";

export enum PageCategory {
  Home = "home",
  GameSelect = "game_select",
  GameCreate = "game_create",
  WorldSelect = "world_select",
  HomebrewSelect = "homebrew_select",
  Auth = "auth",
  GameJoin = "game_join",
  GameOverview = "game_overview",
  GameCharacterSheet = "game_character_sheet",
  GameCharacterCreate = "game_character_create",
  GameSecondScreen = "game_second_screen",
}

export function useSendPageViewEvent(page: PageCategory) {
  useEffect(() => {
    AnalyticsService.logEvent(
      LoggerCategory.App,
      page + "_page",
      LoggerVerb.View,
    );
  }, [page]);
}
