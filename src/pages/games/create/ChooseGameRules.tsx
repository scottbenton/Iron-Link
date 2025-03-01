import { RulesPackageSelector } from "@/components/datasworn/RulesPackageSelector";
import { useCreateGameStore } from "@/stores/createGame.store";

export function ChooseGameRules() {
  const rulesetConfig = useCreateGameStore((store) => store.rulesets);
  const toggleRuleset = useCreateGameStore((store) => store.toggleRuleset);
  const expansionConfig = useCreateGameStore((store) => store.expansions);
  const toggleExpansion = useCreateGameStore((store) => store.toggleExpansion);
  const playsetConfig = useCreateGameStore((store) => store.playset);
  const setPlayset = useCreateGameStore((store) => store.setPlayset);

  return (
    <RulesPackageSelector
      activeRulesetConfig={rulesetConfig}
      onRulesetChange={toggleRuleset}
      activeExpansionConfig={expansionConfig}
      onExpansionChange={toggleExpansion}
      activePlaysetConfig={playsetConfig}
      onPlaysetChange={setPlayset}
    />
  );
}
