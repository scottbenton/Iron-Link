import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { RulesText } from "ui/game/RulesText";
import { Box } from "ui/primitives";

import {
  useConditionMeterRules,
  useImpactRules,
  useSpecialTrackRules,
  useStatRules,
} from "stores/dataswornTree.store";

import { ironswornRulesetConfig } from "data/package.config";

import { referenceDetailMaxWidth } from "../../data/referenceLayout";
import { getReferenceSectionHref } from "../../data/referencePaths";
import { ReferenceImpactCategory } from "./ReferenceImpactCategory";
import { ReferenceRuleEntry } from "./ReferenceRuleEntry";
import { ReferenceRulesGroup } from "./ReferenceRulesGroup";

const referenceRulesAnchors = {
  stats: "stats",
  meters: "meters",
  impacts: "impacts",
  tracks: "tracks",
} as const;

export interface ReferenceRulesProps {
  tabId: string;
}

// The setting's stats, condition meters, impacts and special tracks, each
// group with an anchor so a link can open straight to it.
export function ReferenceRules(props: ReferenceRulesProps) {
  const { tabId } = props;
  const { t } = useTranslation();
  const { hash } = useLocation();

  const statRules = useStatRules();
  const conditionMeterRules = useConditionMeterRules();
  const { impactCategories } = useImpactRules();
  const specialTrackRules = useSpecialTrackRules();

  // The rules render after the packages load, so the browser's own jump to
  // the anchor has already missed them.
  useEffect(() => {
    if (!hash) return;
    const element = document.getElementById(decodeURIComponent(hash.slice(1)));
    element?.scrollIntoView();
  }, [hash]);

  const basePath = getReferenceSectionHref(tabId, "rules");

  const stats = Object.entries(statRules);
  const meters = Object.entries(conditionMeterRules);
  const impactGroups = Object.entries(impactCategories);
  const tracks = Object.entries(specialTrackRules);

  // Ironsworn calls its impacts debilities.
  const impactsTitle =
    tabId === ironswornRulesetConfig.id
      ? t("reference.rules.debilities", "Debilities")
      : t("reference.rules.impacts", "Impacts");
  // Starforged's special tracks are its legacies. Ironsworn's bonds and
  // Elegy's elegies are not.
  const tracksTitle =
    tracks.length > 0 && tracks.every(([key]) => key.endsWith("_legacy"))
      ? t("reference.rules.legacy-tracks", "Legacy Tracks")
      : t("reference.rules.special-tracks", "Special Tracks");

  return (
    <Box maxWidth={referenceDetailMaxWidth} marginInline="auto" width="100%">
      {stats.length > 0 && (
        <ReferenceRulesGroup
          id={referenceRulesAnchors.stats}
          title={t("reference.rules.stats", "Stats")}
          basePath={basePath}
        >
          {stats.map(([key, rule]) => (
            <ReferenceRuleEntry key={key} label={rule.label}>
              <RulesText markdown={rule.description} size="sm" />
            </ReferenceRuleEntry>
          ))}
        </ReferenceRulesGroup>
      )}
      {meters.length > 0 && (
        <ReferenceRulesGroup
          id={referenceRulesAnchors.meters}
          title={t("reference.rules.meters", "Condition Meters")}
          basePath={basePath}
        >
          {meters.map(([key, rule]) => (
            <ReferenceRuleEntry
              key={key}
              label={rule.label}
              detail={t(
                "reference.rules.meter-range",
                "From {{min}} to {{max}}, starts at {{value}}",
                { min: rule.min, max: rule.max, value: rule.value },
              )}
            >
              <RulesText markdown={rule.description} size="sm" />
            </ReferenceRuleEntry>
          ))}
        </ReferenceRulesGroup>
      )}
      {impactGroups.length > 0 && (
        <ReferenceRulesGroup
          id={referenceRulesAnchors.impacts}
          title={impactsTitle}
          basePath={basePath}
        >
          {impactGroups.map(([categoryKey, category]) => (
            <ReferenceImpactCategory
              key={categoryKey}
              category={category}
              getMeterLabel={(meter) =>
                conditionMeterRules[meter]?.label ?? meter
              }
            />
          ))}
        </ReferenceRulesGroup>
      )}
      {tracks.length > 0 && (
        <ReferenceRulesGroup
          id={referenceRulesAnchors.tracks}
          title={tracksTitle}
          basePath={basePath}
        >
          {tracks.map(([key, rule]) => (
            <ReferenceRuleEntry key={key} label={rule.label}>
              <RulesText markdown={rule.description} size="sm" />
            </ReferenceRuleEntry>
          ))}
        </ReferenceRulesGroup>
      )}
    </Box>
  );
}
