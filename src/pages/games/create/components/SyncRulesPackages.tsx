import { useCreateGameStore } from "stores/createGame.store";

import { useSyncActiveRulesPackages } from "../hooks/useSyncActiveRulesPackages";

export function SyncRulesPackages() {
  const rulesets = useCreateGameStore((store) => store.rulesets);
  const expansions = useCreateGameStore((store) => store.expansions);

  useSyncActiveRulesPackages(rulesets, expansions);

  return null;
}
