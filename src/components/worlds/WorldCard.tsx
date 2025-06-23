import {
  Card,
  CardActionArea,
  CardActionAreaProps,
  Typography,
} from "@mui/material";
import { useMemo } from "react";

import {
  defaultBaseRulesets,
  defaultExpansions,
} from "data/datasworn.packages";

import { IWorld } from "services/worlds.service";

interface WorldCardProps extends CardActionAreaProps {
  world: IWorld;
  href?: string;
}
export function WorldCard(props: WorldCardProps) {
  const { world, sx, ...cardActionAreaProps } = props;

  const { rulesets, expansions } = world;

  const rulesPackageString = useMemo(() => {
    const packageNames: string[] = [];

    Object.entries(rulesets).forEach(([rulesetId, isRulesetActive]) => {
      if (isRulesetActive) {
        const ruleset = defaultBaseRulesets[rulesetId];
        packageNames.push(ruleset.title);

        Object.entries(expansions[rulesetId] ?? {}).forEach(
          ([expansionId, isExpansionActive]) => {
            if (isExpansionActive) {
              const expansion = defaultExpansions[rulesetId]?.[expansionId];
              packageNames.push(expansion.title);
            }
          },
        );
      }
    });

    return packageNames.join(", ");
  }, [rulesets, expansions]);

  return (
    <Card
      variant="outlined"
      sx={[
        {
          height: "100%",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <CardActionArea
        {...cardActionAreaProps}
        sx={{
          p: 2,
        }}
      >
        <Typography
          variant="h6"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
          textTransform="uppercase"
        >
          {world.name}
        </Typography>
        <Typography
          color="text.secondary"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
          textTransform="uppercase"
        >
          {rulesPackageString}
        </Typography>
      </CardActionArea>
    </Card>
  );
}
