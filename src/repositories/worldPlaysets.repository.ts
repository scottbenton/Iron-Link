import type { LinkedGamePlayset } from "lib/effectivePlayset";
import { supabase } from "lib/supabase.lib";

import {
  ErrorNoun,
  ErrorVerb,
  getRepositoryError,
} from "./errors/RepositoryErrors";

export class WorldPlaysetsRepository {
  public static async getLinkedGamePlaysets(
    worldId: string,
  ): Promise<LinkedGamePlayset[]> {
    const { data, error, status } = await supabase.rpc("get_world_playsets", {
      p_world_id: worldId,
    });
    if (error || !Array.isArray(data))
      throw getRepositoryError(
        error,
        ErrorVerb.Read,
        ErrorNoun.World,
        false,
        status,
      );
    return data as unknown as LinkedGamePlayset[];
  }
}
