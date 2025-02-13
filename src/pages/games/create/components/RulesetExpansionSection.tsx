import { useTranslation } from "react-i18next";

import { SectionHeading } from "components/SectionHeading";
import { RulesPackageSelector } from "components/datasworn/RulesPackageSelector";

import { useCreateGameStore } from "stores/createGame.store";

export function RulesetExpansionSection() {
  const { t } = useTranslation();

  const rulesets = useCreateGameStore((store) => store.rulesets);
  const toggleRuleset = useCreateGameStore((store) => store.toggleRuleset);
  const expansions = useCreateGameStore((store) => store.expansions);
  const toggleExpansion = useCreateGameStore((store) => store.toggleExpansion);
  const playset = useCreateGameStore((store) => store.playset);
  const setPlayset = useCreateGameStore((store) => store.setPlayset);

  return (
    <>
      <SectionHeading
        label={t("game.create.choose-ruleset-heading", "Choose your Rules")}
        breakContainer
      />
      <RulesPackageSelector
        sx={{ mt: 1 }}
        activeRulesetConfig={rulesets}
        activeExpansionConfig={expansions}
        onRulesetChange={toggleRuleset}
        onExpansionChange={toggleExpansion}
        activePlaysetConfig={playset}
        onPlaysetChange={setPlayset}
      />
    </>
  );
}
