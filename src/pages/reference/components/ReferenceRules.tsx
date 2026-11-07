import { Box, Divider, Paper, Typography } from "@mui/material";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { MarkdownRenderer } from "components/MarkdownRenderer";

import {
  useConditionMeterRules,
  useImpactRules,
  useSpecialTrackRules,
  useStatRules,
} from "stores/dataswornTree.store";

import { ironswornRulesetConfig } from "data/package.config";

import { referenceDetailMaxWidth } from "../data/referenceLayout";
import { getReferenceSectionHref } from "../data/referencePaths";
import { ReferenceShareButton } from "./ReferenceShareButton";

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
    <Box maxWidth={referenceDetailMaxWidth} mx="auto" width="100%">
      {stats.length > 0 && (
        <RulesGroup
          id={referenceRulesAnchors.stats}
          title={t("reference.rules.stats", "Stats")}
          basePath={basePath}
        >
          {stats.map(([key, rule]) => (
            <RuleEntry key={key} label={rule.label}>
              <MarkdownRenderer markdown={rule.description} />
            </RuleEntry>
          ))}
        </RulesGroup>
      )}
      {meters.length > 0 && (
        <RulesGroup
          id={referenceRulesAnchors.meters}
          title={t("reference.rules.meters", "Condition Meters")}
          basePath={basePath}
        >
          {meters.map(([key, rule]) => (
            <RuleEntry
              key={key}
              label={rule.label}
              detail={t(
                "reference.rules.meter-range",
                "From {{min}} to {{max}}, starts at {{value}}",
                { min: rule.min, max: rule.max, value: rule.value },
              )}
            >
              <MarkdownRenderer markdown={rule.description} />
            </RuleEntry>
          ))}
        </RulesGroup>
      )}
      {impactGroups.length > 0 && (
        <RulesGroup
          id={referenceRulesAnchors.impacts}
          title={impactsTitle}
          basePath={basePath}
        >
          {impactGroups.map(([categoryKey, category]) => (
            <Paper
              key={categoryKey}
              variant="outlined"
              sx={{ mb: 2, overflow: "hidden" }}
            >
              <Typography
                variant="subtitle1"
                component="h3"
                fontFamily={(theme) => theme.typography.fontFamilyTitle}
                textTransform="capitalize"
                sx={(theme) => ({
                  px: 2,
                  py: 1,
                  bgcolor: "background.default",
                  borderBottom: `1px solid ${theme.palette.divider}`,
                })}
              >
                {category.label}
              </Typography>
              <Box px={2} pt={1.5}>
                {category.description && (
                  <MarkdownRenderer markdown={category.description} />
                )}
                {Object.entries(category.contents ?? {}).map(
                  ([key, impact]) => {
                    const notes = [
                      impact.permanent
                        ? t("reference.rules.permanent", "Permanent")
                        : undefined,
                      impact.prevents_recovery.length > 0
                        ? t(
                            "reference.rules.prevents-recovery",
                            "Prevents recovery of {{meters}}",
                            {
                              meters: impact.prevents_recovery
                                .map(
                                  (meter) =>
                                    conditionMeterRules[meter]?.label ?? meter,
                                )
                                .join(", "),
                            },
                          )
                        : undefined,
                    ].filter((note): note is string => !!note);
                    return (
                      <RuleEntry
                        key={key}
                        label={impact.label}
                        headingComponent="h4"
                        detail={notes.length > 0 ? notes.join(". ") : undefined}
                      >
                        <MarkdownRenderer markdown={impact.description} />
                      </RuleEntry>
                    );
                  },
                )}
              </Box>
            </Paper>
          ))}
        </RulesGroup>
      )}
      {tracks.length > 0 && (
        <RulesGroup
          id={referenceRulesAnchors.tracks}
          title={tracksTitle}
          basePath={basePath}
        >
          {tracks.map(([key, rule]) => (
            <RuleEntry key={key} label={rule.label}>
              <MarkdownRenderer markdown={rule.description} />
            </RuleEntry>
          ))}
        </RulesGroup>
      )}
    </Box>
  );
}

function RulesGroup(
  props: React.PropsWithChildren<{
    id: string;
    title: string;
    basePath: string;
  }>,
) {
  const { id, title, basePath, children } = props;
  return (
    <Box component="section" aria-labelledby={`${id}-heading`} mb={4}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        flexWrap="wrap"
        mb={1}
      >
        <Typography
          id={`${id}-heading`}
          variant="h5"
          component="h2"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
          textTransform="uppercase"
        >
          {/* The anchor is on the heading's span so the page scrolls to it. */}
          <span id={id} style={{ scrollMarginTop: 16 }}>
            {title}
          </span>
        </Typography>
        <ReferenceShareButton path={`${basePath}#${id}`} name={title} />
      </Box>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Box>
  );
}

function RuleEntry(
  props: React.PropsWithChildren<{
    label: string;
    detail?: string;
    headingComponent?: "h3" | "h4";
  }>,
) {
  const { label, detail, headingComponent = "h3", children } = props;
  return (
    <Box mb={2}>
      <Typography
        variant="subtitle1"
        component={headingComponent}
        fontWeight={600}
        textTransform="capitalize"
      >
        {label}
      </Typography>
      {detail && (
        <Typography variant="body2" color="text.secondary">
          {detail}
        </Typography>
      )}
      {children}
    </Box>
  );
}
