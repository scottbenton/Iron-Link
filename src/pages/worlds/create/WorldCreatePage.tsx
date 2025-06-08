import { Alert, Box, TextField, Typography } from "@mui/material";
import { TFunction } from "i18next";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { GradientButton } from "components/GradientButton";
import { PageContent, PageHeader } from "components/Layout";
import { RadioCard } from "components/RadioCard";
import { SectionHeading } from "components/SectionHeading";
import { RulesPackageSelector } from "components/datasworn/RulesPackageSelector";

import { pathConfig } from "pages/pathConfig";

import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useUID } from "stores/auth.store";
import { useUsersWorlds } from "stores/users.worlds.store";

import { allDefaultPackages } from "data/datasworn.packages";

import {
  ExpansionConfig,
  PlaysetConfig,
  RulesetConfig,
} from "repositories/game.repository";

export default function WorldCreatePage() {
  useSendPageViewEvent(PageCategory.WorldCreate);
  const { t } = useTranslation();
  const uid = useUID();

  const [name, setName] = useState("");
  const [rulesets, setRulesets] = useState<RulesetConfig>({});
  const toggleRuleset = useCallback((rulesetKey: string, active: boolean) => {
    setRulesets((prev) => ({
      ...prev,
      [rulesetKey]: active,
    }));
  }, []);
  const [expansions, setExpansions] = useState<ExpansionConfig>({});
  const toggleExpansion = useCallback(
    (rulesetKey: string, expansionKey: string, active: boolean) => {
      setExpansions((prev) => ({
        ...prev,
        [rulesetKey]: {
          ...prev[rulesetKey],
          [expansionKey]: active,
        },
      }));
    },
    [],
  );
  const [playset, setPlayset] = useState<PlaysetConfig>({});
  const [setting, setSetting] = useState<string | null>(null);
  const truthSetsToChooseFrom = useMemo(() => {
    const rulesPackagesWithTruths = getRulesPackagesWithTruths(
      rulesets,
      expansions,
      t,
    );

    if (rulesPackagesWithTruths.length === 1) {
      setSetting(rulesPackagesWithTruths[0].packageKey);
    } else {
      setSetting(null);
    }

    return rulesPackagesWithTruths;
  }, [rulesets, expansions, t]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const createWorld = useUsersWorlds((store) => store.createWorld);

  const navigate = useNavigate();

  const handleCreateWorld = useCallback(() => {
    if (!uid) return;
    if (!name) {
      setError(
        t("worlds.create.error-name-required", "World name is required."),
      );
      return;
    }
    if (Object.values(rulesets).filter((isActive) => isActive).length === 0) {
      setError(
        t(
          "worlds.create.rulesets-required-error",
          "Please select at least one ruleset",
        ),
      );
      return;
    }
    if (truthSetsToChooseFrom.length > 1 && !setting) {
      setError(t("worlds.create.setting-required", "Please choose a setting."));
      return;
    }

    setError(null);
    setLoading(true);
    createWorld(uid, name, rulesets, expansions, playset, setting)
      .then((worldId) => {
        navigate(pathConfig.world(worldId));
      })
      .catch((err) => {
        setError(
          err.message || t("worlds.create.error", "Failed to create world."),
        );
        setLoading(false);
      });
  }, [
    uid,
    name,
    rulesets,
    expansions,
    playset,
    navigate,
    createWorld,
    t,
    setting,
    truthSetsToChooseFrom,
  ]);

  return (
    <>
      <PageHeader
        maxWidth="sm"
        label={t("worlds.title-create", "Create a World")}
      />
      <PageContent
        maxWidth="sm"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {error && <Alert severity="error">{error}</Alert>}
        <SectionHeading
          label={t("worlds.create.details", "Details")}
          breakContainer
        />
        <TextField
          label={t("worlds.create.name", "World Name")}
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <SectionHeading
          label={t("worlds.create.rules", "Choose Your Rules")}
          breakContainer
        />
        <RulesPackageSelector
          activeRulesetConfig={rulesets}
          onRulesetChange={toggleRuleset}
          activeExpansionConfig={expansions}
          onExpansionChange={toggleExpansion}
          activePlaysetConfig={playset}
          onPlaysetChange={setPlayset}
        />
        {truthSetsToChooseFrom.length > 1 && (
          <>
            <SectionHeading
              label={t("worlds.create.choose-setting", "Choose a Setting")}
              breakContainer
            />
            {truthSetsToChooseFrom.map((truthSet) => (
              <RadioCard
                key={truthSet.packageKey}
                variant="outlined"
                actionAreaProps={{ sx: { p: 2 } }}
                checked={setting === truthSet.packageKey}
                onCheck={() => setSetting(truthSet.packageKey)}
              >
                <Typography
                  variant="h6"
                  sx={(theme) => ({
                    fontFamily: theme.typography.fontFamilyTitle,
                  })}
                >
                  {truthSet.settingName}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {truthSet.label}
                </Typography>
              </RadioCard>
            ))}
          </>
        )}
        <Box display={"flex"} justifyContent={"flex-end"}>
          <GradientButton onClick={handleCreateWorld} disabled={loading}>
            {t("worlds.create.create", "Create World")}
          </GradientButton>
        </Box>
      </PageContent>
    </>
  );
}

function getRulesPackagesWithTruths(
  rulesets: RulesetConfig,
  expansions: ExpansionConfig,
  t: TFunction,
): {
  settingName: string;
  label: string;
  packageKey: string;
}[] {
  const activePackages: string[] = [];

  Object.entries(rulesets).forEach(([key, isActive]) => {
    if (isActive) {
      activePackages.push(key);
    }
  });
  Object.entries(expansions).forEach(([rulesetId, expansionConfig]) => {
    if (activePackages.includes(rulesetId)) {
      Object.entries(expansionConfig).forEach(([expansionId, isActive]) => {
        if (isActive) {
          activePackages.push(expansionId);
        }
      });
    }
  });

  return activePackages
    .filter(
      (pkg) => Object.keys(allDefaultPackages[pkg].truths ?? {}).length > 0,
    )
    .map((pkg) => ({
      label: allDefaultPackages[pkg].title,
      packageKey: pkg,
      settingName: getSettingName(pkg, t),
    }));
}

function getSettingName(packageKey: string, t: TFunction): string {
  console.debug(packageKey);
  if (packageKey === "classic") {
    return t("worlds.create.setting.ironlands", "The Ironlands");
  }
  if (packageKey === "starforged") {
    return t("worlds.create.setting.the-forge", "The Forge");
  }
  if (packageKey === "sundered_isles") {
    return t("worlds.create.setting.sundered-isles", "The Sundered Isles");
  } else {
    return t("worlds.create.setting.unknown", "Unknown Setting");
  }
}
