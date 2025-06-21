import { Alert, Box, BoxProps, TextField, Typography } from "@mui/material";
import { TFunction } from "i18next";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { GradientButton } from "components/GradientButton";
import { RadioCard } from "components/RadioCard";
import { SectionHeading } from "components/SectionHeading";
import { RulesPackageSelector } from "components/datasworn/RulesPackageSelector";

import { useUID } from "stores/auth.store";
import { useUsersWorlds } from "stores/users.worlds.store";

import { allDefaultPackages } from "data/datasworn.packages";

import {
  ExpansionConfig,
  PlaysetConfig,
  RulesetConfig,
} from "repositories/game.repository";

export interface WorldCreateFormProps extends Omit<BoxProps, "children"> {
  rulesConfig?: {
    rulesets: RulesetConfig;
    expansions: ExpansionConfig;
    playset: PlaysetConfig;
  };
  onWorldCreated: (worldId: string) => void;
  floating?: boolean;
}

export function WorldCreateForm(props: WorldCreateFormProps) {
  const { rulesConfig, onWorldCreated, floating, ...boxProps } = props;

  const { t } = useTranslation();
  const uid = useUID();
  const createWorld = useUsersWorlds((store) => store.createWorld);

  const [worldName, setWorldName] = useState("");
  const [rulesets, setRulesets] = useState<RulesetConfig>(
    rulesConfig?.rulesets || {},
  );
  const toggleRuleset = useCallback((rulesetKey: string, active: boolean) => {
    setRulesets((prev) => ({
      ...prev,
      [rulesetKey]: active,
    }));
  }, []);
  const [expansions, setExpansions] = useState<ExpansionConfig>(
    rulesConfig?.expansions ?? {},
  );
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
  const [playset, setPlayset] = useState<PlaysetConfig>(
    rulesConfig?.playset ?? {},
  );
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

  const [{ error, loading }, setLoadingState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: false,
    error: null,
  });

  const handleCreateWorld = useCallback(() => {
    if (!uid) return;
    if (!worldName) {
      setLoadingState({
        loading: false,
        error: t(
          "worlds.create.error-name-required",
          "World name is required.",
        ),
      });
      return;
    }
    if (Object.values(rulesets).filter((isActive) => isActive).length === 0) {
      setLoadingState({
        loading: false,
        error: t(
          "worlds.create.rulesets-required-error",
          "Please select at least one ruleset",
        ),
      });
      return;
    }
    if (truthSetsToChooseFrom.length > 1 && !setting) {
      setLoadingState({
        loading: false,
        error: t("worlds.create.setting-required", "Please choose a setting."),
      });
      return;
    }

    setLoadingState({ loading: true, error: null });
    createWorld(uid, worldName, rulesets, expansions, playset, setting)
      .then((worldId) => {
        onWorldCreated(worldId);
      })
      .catch((err) => {
        setLoadingState({
          loading: false,
          error:
            err.message || t("worlds.create.error", "Failed to create world."),
        });
      });
  }, [
    uid,
    worldName,
    rulesets,
    expansions,
    playset,
    onWorldCreated,
    createWorld,
    t,
    setting,
    truthSetsToChooseFrom,
  ]);

  return (
    <Box display="flex" flexDirection="column" gap={2} {...boxProps}>
      {error && <Alert severity="error">{error}</Alert>}
      <SectionHeading
        label={t("worlds.create.details", "Details")}
        breakContainer={!floating}
        rounded={floating}
      />
      <TextField
        label={t("worlds.create.name", "World Name")}
        fullWidth
        variant="outlined"
        value={worldName}
        onChange={(e) => setWorldName(e.target.value)}
      />
      <SectionHeading
        label={t("worlds.create.rules", "Choose Your Rules")}
        breakContainer={!floating}
        rounded={floating}
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
            breakContainer={!floating}
            rounded={floating}
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
    </Box>
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
