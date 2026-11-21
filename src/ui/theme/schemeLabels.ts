import type { TFunction } from "i18next";

import type { SchemeName } from "./schemes";

/**
 * A scheme's translated name. The English names are each scheme's `label`;
 * keys are spelled out so a key extractor can find them.
 */
export function getSchemeLabels(t: TFunction): Record<SchemeName, string> {
  return {
    default: t("ui.scheme.default", "Sunrise"),
    cinder: t("ui.scheme.cinder", "Cinder"),
    eidolon: t("ui.scheme.eidolon", "Eidolon"),
    hinterlands: t("ui.scheme.hinterlands", "Hinterlands"),
    myriad: t("ui.scheme.myriad", "Myriad"),
    mystic: t("ui.scheme.mystic", "Mystic"),
    orchid: t("ui.scheme.orchid", "Orchid"),
    gloaming: t("ui.scheme.gloaming", "Gloaming"),
    pride_traditional: t("ui.scheme.pride-traditional", "Pride"),
  };
}
