import type { WorldTruthChoice } from "lib/worldTruths.lib";

import { RepositoryError } from "repositories/errors/RepositoryErrors";
import {
  WorldTruthDTO,
  WorldTruthsRepository,
} from "repositories/worldTruths.repository";

export type { WorldTruthChoice };

export class WorldTruthsService {
  public static listenToWorldTruths(
    worldId: string,
    onTruths: (
      changed: WorldTruthChoice[],
      removedTruthIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldTruthsRepository.listenToWorldTruths(
      worldId,
      (changed, removed, replace) =>
        onTruths(changed.map(this.convert), removed, replace),
      onError,
    );
  }

  // Written truths' quest starters, keyed by truth id. Only world editors and
  // Guides receive any.
  public static listenToWorldTruthQuestStarters(
    worldId: string,
    onQuestStarters: (
      changed: Record<string, string>,
      removedTruthIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldTruthsRepository.listenToWorldTruthQuestStarters(
      worldId,
      (changed, removed, replace) =>
        onQuestStarters(
          Object.fromEntries(
            changed.map((row) => [row.truth_id, row.quest_starter]),
          ),
          removed,
          replace,
        ),
      onError,
    );
  }

  public static chooseOption(
    worldId: string,
    truthId: string,
    optionId: string,
    subOptionId: string | null,
  ): Promise<void> {
    return WorldTruthsRepository.chooseOption(
      worldId,
      truthId,
      optionId,
      subOptionId,
    );
  }

  public static setCustomTruth(
    worldId: string,
    truthId: string,
    description: string,
    questStarter: string,
  ): Promise<void> {
    return WorldTruthsRepository.setCustomTruth(
      worldId,
      truthId,
      description,
      questStarter,
    );
  }

  public static clearTruth(worldId: string, truthId: string): Promise<void> {
    return WorldTruthsRepository.clearTruth(worldId, truthId);
  }

  private static convert(row: WorldTruthDTO): WorldTruthChoice {
    return {
      truthId: row.truth_id,
      optionId: row.option_id,
      subOptionId: row.sub_option_id,
      customDescription: row.custom_description,
    };
  }
}
