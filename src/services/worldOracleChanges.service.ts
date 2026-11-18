import { enforceExpansionDependencies } from "data/package.config";

import type { LinkedGamePlayset } from "lib/effectivePlayset";
import {
  getFieldBindingPackageIds,
  loadWorldOracleCatalog,
} from "lib/worldOracleCatalog";
import {
  type WorldOracleChangeInput,
  type WorldOracleTargetChange,
  getWorldOracleTargetChanges,
  withLinkedGame,
  withoutLinkedGame,
} from "lib/worldOracleChanges";

import { RepositoryError } from "repositories/errors/RepositoryErrors";
import { WorldConfigurationRepository } from "repositories/worldConfiguration.repository";
import {
  WorldOracleChangeDTO,
  WorldOracleChangeInputDTO,
  WorldOracleChangesRepository,
} from "repositories/worldOracleChanges.repository";
import { WorldPlaysetsRepository } from "repositories/worldPlaysets.repository";
import { WorldsRepository } from "repositories/worlds.repository";

import { WorldConfigurationService } from "./worldConfiguration.service";
import type { IWorldConfiguration } from "./worldConfiguration.service";

// An open change: a saved roll target moved and nobody has reviewed it yet.
export interface IWorldOracleChange {
  id: string;
  worldId: string;
  fieldId: string;
  ruleIndex: number | null;
  // What the binding rolled before the first unreviewed move, and now.
  previousOracleId: string;
  nextOracleId: string;
  // The game whose link, unlink or playset change caused it, when known.
  sourceGameId: string | null;
  // Orders changes for banner dismissal; a later move to the same binding
  // takes a later number.
  seq: number;
  updatedAt: Date;
}

// What a proposed link, unlink or playset change would do to one world, for
// the save dialog: the moves, plus what labels them.
export interface WorldOracleChangePreview {
  worldId: string;
  worldName: string;
  changes: WorldOracleTargetChange[];
  configuration: IWorldConfiguration;
  // Oracle labels by id, for both ends of every change.
  oracleLabels: Record<string, string>;
}

// The rules part of a game, as the effective playset reads it.
export type GameRules = LinkedGamePlayset;

export function toWorldOracleChangeInputDTO(
  change: WorldOracleChangeInput,
): WorldOracleChangeInputDTO {
  return {
    fieldId: change.fieldId,
    ruleIndex: change.ruleIndex,
    previousOracleId: change.previousOracleId,
    nextOracleId: change.nextOracleId,
    ...(change.keep ? { keep: true } : {}),
  };
}

export class WorldOracleChangesService {
  public static listenToWorldOracleChanges(
    worldId: string,
    onChanges: (changes: Record<string, IWorldOracleChange>) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldOracleChangesRepository.listenToWorldOracleChanges(
      worldId,
      (changes) =>
        onChanges(
          Object.fromEntries(
            changes.map((change) => [change.id, this.convertDTO(change)]),
          ),
        ),
      onError,
    );
  }

  public static listenToDismissal(
    gameId: string,
    worldId: string,
    onDismissedSeq: (seq: number | null) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldOracleChangesRepository.listenToDismissal(
      gameId,
      worldId,
      onDismissedSeq,
      onError,
    );
  }

  // Moves found on read that nobody chose: they take the new target.
  // `linkedGames` is the playsets they were worked out from, as read.
  public static recordChanges(
    worldId: string,
    changes: WorldOracleTargetChange[],
    linkedGames: LinkedGamePlayset[],
  ): Promise<number> {
    return WorldOracleChangesRepository.recordChanges(
      worldId,
      changes.map((change) => toWorldOracleChangeInputDTO(change)),
      linkedGames,
    );
  }

  // Follow the playsets (keep the new target) or always roll the previous one.
  public static resolveChange(
    changeId: string,
    keepPrevious: boolean,
  ): Promise<boolean> {
    return WorldOracleChangesRepository.resolveChange(changeId, keepPrevious);
  }

  public static dismissChanges(
    gameId: string,
    throughSeq: number,
  ): Promise<void> {
    return WorldOracleChangesRepository.dismissChanges(gameId, throughSeq);
  }

  // Linking a game adds its rules to the world's playsets.
  public static previewLink(
    worldId: string,
    game: GameRules,
  ): Promise<WorldOracleChangePreview> {
    return this.preview(worldId, (games) => withLinkedGame(games, game));
  }

  // Unlinking, or moving to another world, takes them away.
  public static previewUnlink(
    worldId: string,
    game: GameRules,
  ): Promise<WorldOracleChangePreview> {
    return this.preview(worldId, (games) => withoutLinkedGame(games, game));
  }

  public static previewRulesChange(
    worldId: string,
    current: GameRules,
    next: GameRules,
  ): Promise<WorldOracleChangePreview> {
    return this.preview(worldId, (games) =>
      withLinkedGame(withoutLinkedGame(games, current), {
        ...next,
        // Saving enforces these, so the preview must too.
        expansions: enforceExpansionDependencies(next.expansions),
      }),
    );
  }

  private static async preview(
    worldId: string,
    proposeGames: (games: LinkedGamePlayset[]) => LinkedGamePlayset[],
  ): Promise<WorldOracleChangePreview> {
    const [world, configurationDTO, linkedGames] = await Promise.all([
      WorldsRepository.getWorld(worldId),
      WorldConfigurationRepository.getWorldConfiguration(worldId),
      WorldPlaysetsRepository.getLinkedGamePlaysets(worldId),
    ]);
    const configuration =
      WorldConfigurationService.convertConfigurationDTO(configurationDTO);
    const fields = Object.values(configuration.fieldDefinitions);
    if (!configuration.configurationCustomized) {
      return {
        worldId,
        worldName: world.name,
        changes: [],
        configuration,
        oracleLabels: {},
      };
    }
    const catalog = await loadWorldOracleCatalog({
      linkedGames: proposeGames(linkedGames),
      settingKey: world.setting_key,
      bindingPackageIds: getFieldBindingPackageIds(fields),
    });
    const changes = getWorldOracleTargetChanges(
      worldId,
      true,
      fields,
      catalog.replacementMap,
    );
    const ids = new Set(
      changes.flatMap((change) => [
        change.previousOracleId,
        change.nextOracleId,
      ]),
    );
    const oracleLabels = Object.fromEntries(
      catalog.choices
        .filter((choice) => ids.has(choice.id))
        .map((choice) => [choice.id, choice.label]),
    );
    return {
      worldId,
      worldName: world.name,
      changes,
      configuration,
      oracleLabels,
    };
  }

  private static convertDTO(change: WorldOracleChangeDTO): IWorldOracleChange {
    return {
      id: change.id,
      worldId: change.world_id,
      fieldId: change.field_definition_id,
      ruleIndex: change.rule_index,
      previousOracleId: change.previous_oracle_id,
      nextOracleId: change.next_oracle_id,
      sourceGameId: change.source_game_id,
      seq: change.seq,
      updatedAt: new Date(change.updated_at),
    };
  }
}
