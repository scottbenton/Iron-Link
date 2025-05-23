import { useCreateGameStore } from "stores/createGame.store";

import { useSyncActiveRulesPackages } from "../hooks/useSyncActiveRulesPackages";

export function SyncRulesPackages() {
  const rulesets = useCreateGameStore((store) => store.rulesets);
  const expansions = useCreateGameStore((store) => store.expansions);
  const playset = useCreateGameStore((store) => store.playset);

  useSyncActiveRulesPackages(rulesets, expansions, playset);

  return null;
}
