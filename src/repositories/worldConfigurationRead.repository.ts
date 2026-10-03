import type { Json } from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import {
  ErrorNoun,
  ErrorVerb,
  getRepositoryError,
} from "./errors/RepositoryErrors";

export interface WorldConfigurationSnapshotDTO {
  configuration_customized: boolean;
  categories: {
    id: string;
    world_id: string;
    name: string;
    icon: Json | null;
    sort_order: number;
    supports_hierarchy: boolean;
    supports_map: boolean;
    supports_bonds: boolean;
    subtitle_field_definition_id: string | null;
  }[];
  field_definitions: {
    id: string;
    world_id: string;
    category_id: string;
    key: string;
    label: string;
    type: string;
    binding: Json | null;
    configuration: Json;
    gm_only: boolean;
    sort_order: number;
  }[];
}

export class WorldConfigurationReadRepository {
  public static async getWorldConfiguration(
    worldId: string,
  ): Promise<WorldConfigurationSnapshotDTO> {
    const { data, error, status } = await supabase.rpc(
      "get_world_configuration",
      { p_world_id: worldId },
    );
    if (error) {
      throw getRepositoryError(
        error,
        ErrorVerb.Read,
        ErrorNoun.WorldCategory,
        true,
        status,
      );
    }
    return data as unknown as WorldConfigurationSnapshotDTO;
  }
}
