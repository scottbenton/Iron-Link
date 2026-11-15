import { Button, capitalize } from "@mui/material";
import { TFunction } from "i18next";
import { closeSnackbar, enqueueSnackbar } from "notistack";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { parseRepositoryErrorAndCreateSnackbar } from "providers/SnackbarProvider";

import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useWorldEntryBondsStore } from "stores/worldEntryBonds.store";

import { MAX_TICKS, TICKS_PER_BOX } from "lib/progressTrack.lib";
import {
  CONNECTION_BOND_REWARD_TICKS,
  IRONLANDS_BOND_TICKS,
  WorldBondMechanics,
} from "lib/worldBonds.lib";

import { Difficulty } from "repositories/tracks.repository";

import {
  IWorldConnectionUpdate,
  IWorldEntryBond,
  IWorldEntryBondKey,
} from "services/worldEntryBonds.service";

// Changes a character's bonds, keeping their Bonds track in step: forming an
// Ironlands bond marks a tick, and a connection becoming a bond marks its
// rank's reward. Each such change says what it marked and offers Undo.
export function useWorldBondActions(mechanics: WorldBondMechanics | null) {
  const { t } = useTranslation();
  const addBondToStore = useWorldEntryBondsStore((store) => store.addBond);
  const removeBondFromStore = useWorldEntryBondsStore(
    (store) => store.removeBond,
  );
  const addConnectionToStore = useWorldEntryBondsStore(
    (store) => store.addConnection,
  );
  const updateConnectionInStore = useWorldEntryBondsStore(
    (store) => store.updateConnection,
  );
  const updateSpecialTrackValue = useGameCharactersStore(
    (store) => store.updateSpecialTrackValue,
  );

  const trackLabel = capitalize(mechanics?.trackLabel ?? "");

  // Moves the character's Bonds track by `delta` ticks and returns how to put
  // it back, or nothing if the track did not move.
  const markTrack = useCallback(
    async (characterId: string, delta: number) => {
      if (!mechanics) return undefined;
      const character =
        useGameCharactersStore.getState().characters[characterId];
      if (!character) return undefined;
      const before = character.specialTracks[mechanics.trackKey]?.value ?? 0;
      const after = Math.max(0, Math.min(MAX_TICKS, before + delta));
      if (after === before) return undefined;
      await updateSpecialTrackValue(characterId, mechanics.trackKey, after);
      return () =>
        updateSpecialTrackValue(characterId, mechanics.trackKey, before);
    },
    [mechanics, updateSpecialTrackValue],
  );

  const notify = useCallback(
    (message: string, undo: () => Promise<unknown>) => {
      enqueueSnackbar(message, {
        variant: "info",
        action: (id) => (
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              closeSnackbar(id);
              undo().catch(parseRepositoryErrorAndCreateSnackbar);
            }}
          >
            {t("worlds.bonds.undo", "Undo")}
          </Button>
        ),
      });
    },
    [t],
  );

  // Ironlands: turns a bond on or off, with a tick on the Bonds track.
  const setBond = useCallback(
    async (key: IWorldEntryBondKey, bonded: boolean) => {
      try {
        if (bonded) await addBondToStore(key);
        else await removeBondFromStore(key);
        const restoreTrack = await markTrack(
          key.characterId,
          bonded ? IRONLANDS_BOND_TICKS : -IRONLANDS_BOND_TICKS,
        );
        const name = getName(key.characterId);
        const message = bonded
          ? restoreTrack
            ? t(
                "worlds.bonds.bond-marked",
                "Marked a tick on {{name}}'s {{track}} track",
                { name, track: trackLabel },
              )
            : t("worlds.bonds.bond-added", "{{name}} formed a bond", { name })
          : restoreTrack
            ? t(
                "worlds.bonds.bond-unmarked",
                "Removed a tick from {{name}}'s {{track}} track",
                { name, track: trackLabel },
              )
            : t("worlds.bonds.bond-removed", "{{name}} cleared a bond", {
                name,
              });
        notify(message, async () => {
          if (bonded) await removeBondFromStore(key);
          else await addBondToStore(key);
          await restoreTrack?.();
        });
      } catch (error) {
        parseRepositoryErrorAndCreateSnackbar(error);
      }
    },
    [addBondToStore, removeBondFromStore, markTrack, notify, t, trackLabel],
  );

  // Starforged: a connection becoming a bond marks its rank's reward.
  const setBonded = useCallback(
    async (connection: IWorldEntryBond, bonded: boolean) => {
      if (!connection.rank) return;
      try {
        await updateConnectionInStore(connection, { bonded });
        const reward = CONNECTION_BOND_REWARD_TICKS[connection.rank];
        const restoreTrack = await markTrack(
          connection.characterId,
          bonded ? reward : -reward,
        );
        if (!restoreTrack) return;
        const name = getName(connection.characterId);
        const amount = formatTicks(reward, t);
        notify(
          bonded
            ? t(
                "worlds.bonds.reward-marked",
                "Marked {{amount}} on {{name}}'s {{track}} track",
                { amount, name, track: trackLabel },
              )
            : t(
                "worlds.bonds.reward-unmarked",
                "Removed {{amount}} from {{name}}'s {{track}} track",
                { amount, name, track: trackLabel },
              ),
          async () => {
            await updateConnectionInStore(connection, { bonded: !bonded });
            await restoreTrack();
          },
        );
      } catch (error) {
        parseRepositoryErrorAndCreateSnackbar(error);
      }
    },
    [updateConnectionInStore, markTrack, notify, t, trackLabel],
  );

  const makeConnection = useCallback(
    (key: IWorldEntryBondKey, rank: Difficulty) =>
      addConnectionToStore(key, rank).catch(
        parseRepositoryErrorAndCreateSnackbar,
      ),
    [addConnectionToStore],
  );

  const updateConnection = useCallback(
    (key: IWorldEntryBondKey, update: IWorldConnectionUpdate) =>
      updateConnectionInStore(key, update).catch(
        parseRepositoryErrorAndCreateSnackbar,
      ),
    [updateConnectionInStore],
  );

  const removeConnection = useCallback(
    (key: IWorldEntryBondKey) =>
      removeBondFromStore(key).catch(parseRepositoryErrorAndCreateSnackbar),
    [removeBondFromStore],
  );

  return {
    setBond,
    setBonded,
    makeConnection,
    updateConnection,
    removeConnection,
  };
}

function getName(characterId: string) {
  return useGameCharactersStore.getState().characters[characterId]?.name ?? "";
}

// "2 ticks", "3 boxes": whole boxes read as boxes.
export function formatTicks(ticks: number, t: TFunction): string {
  return ticks % TICKS_PER_BOX === 0
    ? t("worlds.bonds.boxes", "{{count}} boxes", {
        count: ticks / TICKS_PER_BOX,
        defaultValue_one: "a box",
      })
    : t("worlds.bonds.ticks", "{{count}} ticks", {
        count: ticks,
        defaultValue_one: "a tick",
      });
}
