import type { Json } from "types/supabase-generated.type";

import type { LinkedGamePlayset } from "lib/effectivePlayset";
import { supabase } from "lib/supabase.lib";
import type { WorldTemplateManifest } from "lib/worldTemplates";

import {
  ErrorNoun,
  ErrorVerb,
  getRepositoryError,
} from "./errors/RepositoryErrors";

export class WorldTemplatesRepository {
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

  public static async createWorld(
    name: string,
    description: string | null,
    settingKey: string | null,
    template: WorldTemplateManifest,
  ): Promise<string> {
    const { data, error, status } = await supabase.rpc(
      "create_world_with_template",
      {
        p_name: name,
        p_description: description ?? undefined,
        p_setting_key: settingKey ?? undefined,
        p_template: template as unknown as Json,
      },
    );
    if (error || !data)
      throw getRepositoryError(
        error,
        ErrorVerb.Create,
        ErrorNoun.World,
        false,
        status,
      );
    return data;
  }

  public static async seedWorld(
    worldId: string,
    template: WorldTemplateManifest,
  ): Promise<boolean> {
    const { data, error, status } = await supabase.rpc("seed_world_template", {
      p_world_id: worldId,
      p_template: template as unknown as Json,
    });
    if (error || typeof data !== "boolean")
      throw getRepositoryError(
        error,
        ErrorVerb.Update,
        ErrorNoun.World,
        false,
        status,
      );
    return data;
  }
}
