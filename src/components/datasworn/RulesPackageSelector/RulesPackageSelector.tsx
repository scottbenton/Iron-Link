import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";
import {
  defaultBaseRulesets,
  defaultExpansions,
  defaultPlaysets,
} from "@/data/datasworn.packages";
import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import { PlaysetConfig } from "@/repositories/game.repository";
// import { PlaysetDialog } from "./PlaysetDialog";
import { Box, BoxProps, Collapsible, Tag, Text } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";
import { CheckIcon, InfoIcon } from "lucide-react";
import { Dispatch, SetStateAction, useMemo } from "react";

import { PlaysetDialog } from "./PlaysetDialog";

export interface RulesPackageSelectorProps {
  activeRulesetConfig: Record<string, boolean>;
  onRulesetChange: (rulesetKey: string, isActive: boolean) => void;
  activeExpansionConfig: Record<string, Record<string, boolean>>;
  onExpansionChange: (
    rulesetKey: string,
    expansionKey: string,
    isActive: boolean,
  ) => void;
  activePlaysetConfig: PlaysetConfig;
  onPlaysetChange: Dispatch<SetStateAction<PlaysetConfig>>;
}

export function RulesPackageSelector(
  props: RulesPackageSelectorProps & BoxProps,
) {
  const {
    activeRulesetConfig,
    onRulesetChange,
    activeExpansionConfig,
    onExpansionChange,
    activePlaysetConfig,
    onPlaysetChange,
    ...boxProps
  } = props;

  const t = useDataswornTranslations();

  const rulesets = defaultBaseRulesets;
  const expansions = defaultExpansions;

  const { activeRulesets, activeExpansions } = useMemo(() => {
    const activeRulesets: Record<string, Datasworn.Ruleset> = {};
    const activeExpansions: Record<string, Datasworn.Expansion> = {};

    Object.entries(activeRulesetConfig).forEach(([rulesetId, isActive]) => {
      if (isActive) {
        activeRulesets[rulesetId] = rulesets[rulesetId];
        Object.entries(activeExpansionConfig[rulesetId] ?? {}).forEach(
          ([expansionId, isActive]) => {
            if (isActive) {
              activeExpansions[expansionId] =
                expansions[rulesetId][expansionId];
            }
          },
        );
      }
    });

    return { activeRulesets, activeExpansions };
  }, [rulesets, activeRulesetConfig, expansions, activeExpansionConfig]);

  const hasActiveRulesets = Object.values(activeRulesetConfig).some(
    (val) => val,
  );

  return (
    <Box
      {...boxProps}
      display="flex"
      flexDirection="column"
      gap={2}
      alignItems={"flex-start"}
    >
      {Object.entries(rulesets).map(([rulesetKey, ruleset]) => (
        <Box key={rulesetKey}>
          <Checkbox
            checked={activeRulesetConfig[rulesetKey] ?? false}
            onCheckedChange={(details) =>
              onRulesetChange(rulesetKey, details.checked === true)
            }
          >
            {ruleset.title}
          </Checkbox>
          <Box
            ml={2}
            borderColor={"divider"}
            borderLeft={`1px dotted`}
            pl={4}
            display="flex"
            flexDirection="column"
            gap={1}
            py={2}
            mt={1}
          >
            {Object.entries(expansions[rulesetKey] || {}).map(
              ([expansionKey, expansion]) => (
                <Box key={expansionKey}>
                  <Checkbox
                    checked={
                      activeRulesetConfig[rulesetKey]
                        ? (activeExpansionConfig[rulesetKey]?.[expansionKey] ??
                          false)
                        : false
                    }
                    onCheckedChange={(details) =>
                      onExpansionChange(
                        rulesetKey,
                        expansionKey,
                        details.checked === true,
                      )
                    }
                    disabled={!activeRulesetConfig[rulesetKey]} // Disable if the ruleset is not active
                  >
                    {expansion.title}
                  </Checkbox>
                  {defaultPlaysets[expansion._id] && (
                    <Collapsible.Root
                      open={activeExpansionConfig[rulesetKey]?.[expansionKey]}
                    >
                      <Collapsible.Content>
                        <Box ml={8}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Text fontSize="sm">
                              {t(
                                "game.playset.default",
                                "Apply a default playset (optional)",
                              )}
                            </Text>
                            <Tooltip
                              content={defaultPlaysets[expansion._id].info}
                            >
                              <InfoIcon color="info" />
                            </Tooltip>
                          </Box>

                          <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                            {defaultPlaysets[expansion._id].playsets.map(
                              (defaultPlayset, index) => (
                                <Tag.Root
                                  key={index}
                                  rounded="full"
                                  asChild
                                  size="md"
                                  py={1}
                                  px={3}
                                  cursor="pointer"
                                >
                                  <button
                                    onClick={() =>
                                      onPlaysetChange(defaultPlayset.playset)
                                    }
                                  >
                                    {activePlaysetConfig ===
                                    defaultPlayset.playset ? (
                                      <Tag.StartElement>
                                        <CheckIcon />
                                      </Tag.StartElement>
                                    ) : undefined}
                                    <Tag.Label>
                                      {defaultPlayset.label}
                                    </Tag.Label>
                                  </button>
                                </Tag.Root>
                              ),
                            )}
                          </Box>
                        </Box>
                      </Collapsible.Content>
                    </Collapsible.Root>
                  )}
                </Box>
              ),
            )}
          </Box>
        </Box>
      ))}
      {hasActiveRulesets && (
        <PlaysetDialog
          playset={activePlaysetConfig}
          setPlayset={onPlaysetChange}
          rulesets={activeRulesets}
          expansions={activeExpansions}
        />
      )}
    </Box>
  );
}
