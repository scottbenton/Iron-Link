import { useTranslation } from "react-i18next";

import { Chip } from "ui/components/Chip";
import { Text } from "ui/components/Text";
import { Flex } from "ui/primitives";

export function RulesetsStrip() {
  const { t } = useTranslation();

  const rulesets = [
    t("home.rulesets.ironsworn", "Ironsworn"),
    t("home.rulesets.starforged", "Starforged"),
    t("home.rulesets.sundered-isles", "Sundered Isles"),
  ];

  return (
    <Flex flexWrap="wrap" alignItems="center" justifyContent="center" gap="2">
      <Text variant="eyebrow" css={{ marginInlineEnd: "2" }}>
        {t("home.rulesets.eyebrow", "Supports")}
      </Text>
      {rulesets.map((ruleset) => (
        <Chip key={ruleset}>{ruleset}</Chip>
      ))}
    </Flex>
  );
}
