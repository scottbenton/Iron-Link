import type { Json } from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";
import type { WorldFieldCondition } from "lib/worldFieldRules";

import {
  ErrorNoun,
  ErrorVerb,
  getRepositoryError,
} from "./errors/RepositoryErrors";

export interface DefaultWorldFieldBinding {
  id: string;
  binding: Json;
  rule_bindings: {
    index: number;
    binding: Json;
    conditions: WorldFieldCondition[];
  }[];
}

/** The server atomically forks current defaults, if necessary, and applies the edit. */
export async function mutateWorldConfiguration(
  worldId: string,
  operation: Json,
  defaultBindings?: DefaultWorldFieldBinding[],
): Promise<void> {
  const { error, status } = await supabase.rpc("mutate_world_configuration", {
    p_world_id: worldId,
    p_operation: operation,
    p_default_bindings: defaultBindings as unknown as Json | undefined,
  });
  if (error)
    throw getRepositoryError(
      error,
      ErrorVerb.Update,
      ErrorNoun.WorldCategory,
      false,
      status,
    );
}
