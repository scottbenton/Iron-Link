import { Datasworn } from "@datasworn-community/core";
import { useTranslation } from "react-i18next";

import { Card, CardBody, CardHeader } from "ui/components/Card";
import { RulesText } from "ui/game/RulesText";
import { Box } from "ui/primitives";

import { ReferenceRuleEntry } from "./ReferenceRuleEntry";

export interface ReferenceImpactCategoryProps {
  category: Datasworn.ImpactCategory;
  // Names a meter an impact keeps from recovering, by its key.
  getMeterLabel: (meterKey: string) => string;
}

// A card for one kind of impact (misfortunes, lasting effects and so on),
// listing each impact with what it does to the character.
export function ReferenceImpactCategory(props: ReferenceImpactCategoryProps) {
  const { category, getMeterLabel } = props;
  const { t } = useTranslation();

  return (
    <Card css={{ marginBlockEnd: "4" }}>
      <CardHeader
        titleAs="h3"
        title={
          <Box as="span" textTransform="capitalize">
            {category.label}
          </Box>
        }
      />
      <CardBody>
        {category.description && (
          <RulesText markdown={category.description} size="sm" />
        )}
        {Object.entries(category.contents ?? {}).map(([key, impact]) => {
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
                      .map(getMeterLabel)
                      .join(", "),
                  },
                )
              : undefined,
          ].filter((note): note is string => !!note);
          return (
            <ReferenceRuleEntry
              key={key}
              label={impact.label}
              headingAs="h4"
              detail={notes.length > 0 ? notes.join(". ") : undefined}
            >
              <RulesText markdown={impact.description} size="sm" />
            </ReferenceRuleEntry>
          );
        })}
      </CardBody>
    </Card>
  );
}
