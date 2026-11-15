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
  IWorldEntryBondKey,
  IWorldEntryConnection,
} from "services/worldEntryBonds.service";

import type { WorldBondCharacter } from "./useWorldBondCharacters";
import { formatNames } from "./worldBondLabels";

// Changes characters' bonds, keeping their Bonds track in step: forming an
// Ironlands bond marks a tick, and a connection becoming a bond marks its
// rank's reward for everyone who shares it. Each such change says what it
// marked and offers Undo.
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
  const shareConnectionInStore = useWorldEntryBondsStore(
    (store) => store.shareConnection,
  );
  const updateSpecialTrackValue = useGameCharactersStore(
    (store) => store.updateSpecialTrackValue,
  );

  const trackLabel = capitalize(mechanics?.trackLabel ?? "");

  // Moves the character's Bonds track by `delta` ticks and returns how to put
  // it back, or nothing if the track did not move.
  const markTrack = useCallback(
    async (characterId: string, delta: number) => {
      if (!mechanics?.trackKey) return undefined;
      const trackKey = mechanics.trackKey;
      const character =
        useGameCharactersStore.getState().characters[characterId];
      if (!character) return undefined;
      const before = character.specialTracks[trackKey]?.value ?? 0;
      const after = Math.max(0, Math.min(MAX_TICKS, before + delta));
      if (after === before) return undefined;
      await updateSpecialTrackValue(characterId, trackKey, after);
      return () => updateSpecialTrackValue(characterId, trackKey, before);
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

  // A connection becoming a bond marks its rank's reward on the track of
  // every character who shares it and whom this person may edit; anyone
  // else is told to mark their own.
  const setBonded = useCallback(
    async (
      connection: IWorldEntryConnection,
      members: WorldBondCharacter[],
      bonded: boolean,
    ) => {
      try {
        await updateConnectionInStore(connection.id, { bonded });
        const reward = CONNECTION_BOND_REWARD_TICKS[connection.rank];
        const amount = formatTicks(reward, t);
        const marked: WorldBondCharacter[] = [];
        const restores: (() => Promise<unknown>)[] = [];
        for (const member of members.filter((member) => member.canEdit)) {
          const restore = await markTrack(member.id, bonded ? reward : -reward);
          if (restore) {
            marked.push(member);
            restores.push(restore);
          }
        }
        const others = members.filter((member) => !member.canEdit);
        const parts: string[] = [];
        if (marked.length > 0) {
          const names = formatNames(
            marked.map((member) => member.name),
            t,
          );
          parts.push(
            bonded
              ? t(
                  "worlds.bonds.reward-marked",
                  "Marked {{amount}} on {{names}}'s {{track}} tracks.",
                  {
                    amount,
                    names,
                    track: trackLabel,
                    count: marked.length,
                    defaultValue_one:
                      "Marked {{amount}} on {{names}}'s {{track}} track.",
                  },
                )
              : t(
                  "worlds.bonds.reward-unmarked",
                  "Removed {{amount}} from {{names}}'s {{track}} tracks.",
                  {
                    amount,
                    names,
                    track: trackLabel,
                    count: marked.length,
                    defaultValue_one:
                      "Removed {{amount}} from {{names}}'s {{track}} track.",
                  },
                ),
          );
        } else if (bonded && !mechanics?.trackKey) {
          // Rules without a bonds track: say what to mark by hand.
          parts.push(
            t(
              "worlds.bonds.reward-reminder",
              "Now a bond. Mark {{amount}} on your legacy track.",
              { amount },
            ),
          );
        }
        if (bonded && others.length > 0) {
          parts.push(
            t(
              "worlds.bonds.reward-others",
              "{{names}} should mark {{amount}} too.",
              {
                names: formatNames(
                  others.map((member) => member.name),
                  t,
                ),
                amount,
              },
            ),
          );
        }
        if (parts.length === 0) return;
        notify(parts.join(" "), async () => {
          await updateConnectionInStore(connection.id, { bonded: !bonded });
          await Promise.all(restores.map((restore) => restore()));
        });
      } catch (error) {
        parseRepositoryErrorAndCreateSnackbar(error);
      }
    },
    [updateConnectionInStore, markTrack, notify, t, trackLabel, mechanics],
  );

  const makeConnection = useCallback(
    (key: IWorldEntryBondKey, rank: Difficulty) =>
      addConnectionToStore(key, rank).catch(
        parseRepositoryErrorAndCreateSnackbar,
      ),
    [addConnectionToStore],
  );

  const shareConnection = useCallback(
    (key: IWorldEntryBondKey, connectionId: string) =>
      shareConnectionInStore(key, connectionId).catch(
        parseRepositoryErrorAndCreateSnackbar,
      ),
    [shareConnectionInStore],
  );

  const updateConnection = useCallback(
    (connectionId: string, update: IWorldConnectionUpdate) =>
      updateConnectionInStore(connectionId, update).catch(
        parseRepositoryErrorAndCreateSnackbar,
      ),
    [updateConnectionInStore],
  );

  // Takes a character out of a connection; the last one out removes it.
  const leaveConnection = useCallback(
    (key: IWorldEntryBondKey) =>
      removeBondFromStore(key).catch(parseRepositoryErrorAndCreateSnackbar),
    [removeBondFromStore],
  );

  return {
    setBond,
    setBonded,
    makeConnection,
    shareConnection,
    updateConnection,
    leaveConnection,
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
