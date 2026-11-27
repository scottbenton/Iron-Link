import { useTranslation } from "react-i18next";

import { Stack } from "ui/primitives";

import { ScreenshotRow } from "./ScreenshotRow";

export function ScreenshotShowcase() {
  const { t } = useTranslation();

  return (
    <Stack gap="12">
      <ScreenshotRow
        title={t("home.showcase.sheet-title", "A sheet that plays fast")}
        description={t(
          "home.showcase.sheet-description",
          "Tap a stat to roll it. Assets, meters, momentum, and vows on one screen, with the full rules reference one click away.",
        )}
        imageSrc="/images/SoloGame.webp"
        imageAlt={t(
          "home.showcase.sheet-image-alt",
          "Screenshot of a solo game with a character overview, notes, and the reference sidebar all visible.",
        )}
      />
      <ScreenshotRow
        title={t("home.showcase.overview-title", "One view of the whole game")}
        description={t(
          "home.showcase.overview-description",
          "Every character, shared track, and clock in your campaign, live — whether you're across the table or across the world.",
        )}
        imageSrc="/images/GuidedGame.webp"
        imageAlt={t(
          "home.showcase.overview-image-alt",
          "Screenshot of a guided game with characters, notes, and the game's log all visible.",
        )}
        imageFirst
      />
    </Stack>
  );
}
