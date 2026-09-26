import type { LinkedGamePlayset } from "lib/effectivePlayset";
import { loadWorldOracleCatalog } from "lib/worldOracleCatalog";
import {
  buildWorldTemplate,
  getWorldTemplateBindings,
} from "lib/worldTemplates";

import { WorldTemplatesRepository } from "repositories/worldTemplates.repository";

export class WorldTemplatesService {
  public static async createWorld(
    name: string,
    description: string | null,
    settingKey: string | null,
    creationGame?: LinkedGamePlayset,
  ) {
    const base = buildWorldTemplate(settingKey);
    const catalog = await loadWorldOracleCatalog({
      settingKey,
      linkedGames: creationGame ? [creationGame] : [],
      bindings: getWorldTemplateBindings(base),
    });
    const template = buildWorldTemplate(settingKey, catalog.replacementMap);
    return WorldTemplatesRepository.createWorld(
      name,
      description,
      settingKey,
      template,
    );
  }
}
