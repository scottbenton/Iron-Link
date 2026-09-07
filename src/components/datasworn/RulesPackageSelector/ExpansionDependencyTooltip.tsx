import InfoIcon from "@mui/icons-material/Info";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";

import {
  IExpansionConfig,
  getExpansionDependencies,
  getExpansionDependents,
} from "data/package.config";

interface ExpansionDependencyTooltipProps {
  rulesetKey: string;
  expansionKey: string;
  expansionName: string;
  expansions: Record<string, IExpansionConfig>;
}

export function ExpansionDependencyTooltip(
  props: ExpansionDependencyTooltipProps,
) {
  const { rulesetKey, expansionKey, expansionName, expansions } = props;
  const { t } = useTranslation();

  const dependencyNames = getExpansionDependencies(rulesetKey, expansionKey)
    .map((dependencyKey) => expansions[dependencyKey]?.name)
    .filter(Boolean);
  const dependentNames = getExpansionDependents(rulesetKey, expansionKey)
    .map((dependentKey) => expansions[dependentKey]?.name)
    .filter(Boolean);

  const dependencyList = dependencyNames.join(", ");
  const dependentList = dependentNames.join(", ");

  const tooltip =
    dependencyList.length > 0
      ? t(
          "ruleset-selector.expansion-enables-dependencies",
          "{{expansion}} uses content from {{dependencies}}, so enabling it also enables {{dependencies}}.",
          { expansion: expansionName, dependencies: dependencyList },
        )
      : dependentList.length > 0
        ? t(
            "ruleset-selector.expansion-disables-dependents",
            "{{dependents}} depends on {{expansion}}, so turning {{expansion}} off also turns {{dependents}} off.",
            { dependents: dependentList, expansion: expansionName },
          )
        : null;

  if (!tooltip) return null;

  return (
    <Tooltip title={tooltip}>
      <InfoIcon color="info" fontSize="small" sx={{ ml: 0.5 }} />
    </Tooltip>
  );
}
