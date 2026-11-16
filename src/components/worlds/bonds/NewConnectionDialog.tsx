import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { FormEvent, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { parseRepositoryErrorAndCreateSnackbar } from "providers/SnackbarProvider";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { useUID } from "stores/auth.store";
import { useWorldPermission } from "stores/world.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";
import { useWorldEntryConnections } from "stores/worldEntryBonds.store";

import { getDialogFormSlotProps } from "lib/dialogForm.lib";

import { WorldPermission } from "repositories/shared.types";
import { Difficulty } from "repositories/tracks.repository";

import { IWorldConnectionNew } from "services/worldEntryBonds.service";

import { getWorldEntryVisibilityPermissions } from "../entries/worldEntryPermissions";
import { CONNECTION_RANKS, getRankLabel } from "./worldBondLabels";

const PARTY = "party";

type NpcOption = { entryId: string; name: string } | { create: string };

export interface NewConnectionDialogProps {
  onClose: () => void;
  gameId: string;
  worldId: string;
  characterId: string;
  characterName: string;
  // Whether the game has other characters to share a connection with.
  canShare: boolean;
  // Resolves to nothing when it failed (and said so).
  onCreate: (connection: IWorldConnectionNew) => Promise<unknown>;
}

// A new connection from the character sheet: with an NPC of the world (one
// already there, or a new one named here), for this character or the whole
// party, at a rank. Mount it to open it, so each opening starts empty.
export function NewConnectionDialog({
  onClose,
  gameId,
  worldId,
  characterId,
  characterName,
  canShare,
  onCreate,
}: NewConnectionDialogProps) {
  const { t } = useTranslation();
  const uid = useUID();
  const permission = useWorldPermission();
  const canCreateEntry =
    !!uid &&
    !!permission &&
    permission !== WorldPermission.None &&
    permission !== WorldPermission.Viewer;
  const createEntry = useWorldEntriesStore((store) => store.createEntry);
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const categories = useWorldCategoriesStore((store) => store.categories);
  const connections = useWorldEntryConnections();

  const bondCategories = useMemo(
    () =>
      Object.entries(categories)
        .filter(([, category]) => category.supportsBonds)
        .sort(([, a], [, b]) => a.sortOrder - b.sortOrder)
        .map(([id, category]) => ({ id, name: category.name })),
    [categories],
  );

  const [npc, setNpc] = useState<NpcOption | null>(null);
  const [input, setInput] = useState("");
  const [categoryId, setCategoryId] = useState(bondCategories[0]?.id ?? "");
  const [owner, setOwner] = useState(characterId);
  const [rank, setRank] = useState<Difficulty | "">("");
  const [saving, setSaving] = useState(false);

  // Connections already made in this game, by entry.
  const taken = useMemo(() => {
    const byEntry: Record<string, (string | null)[]> = {};
    Object.values(connections)
      .filter((connection) => connection.gameId === gameId)
      .forEach((connection) => {
        (byEntry[connection.entryId] ??= []).push(connection.characterId);
      });
    return byEntry;
  }, [connections, gameId]);

  // An entry can take a party connection while no one has one with it, and
  // this character's while neither they nor the party have one.
  const available = (entryId: string, forParty: boolean) => {
    const holders = taken[entryId] ?? [];
    return forParty
      ? holders.length === 0
      : !holders.includes(null) && !holders.includes(characterId);
  };

  const forParty = owner === PARTY;
  const options: NpcOption[] = useMemo(() => {
    const bondCategoryIds = new Set(bondCategories.map(({ id }) => id));
    return Object.values(entries)
      .filter(
        (entry) =>
          entry.worldId === worldId &&
          bondCategoryIds.has(entry.categoryId) &&
          available(entry.id, forParty),
      )
      .map((entry) => ({ entryId: entry.id, name: entry.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, worldId, bondCategories, taken, forParty, characterId]);

  const query = input.trim();
  const ready = !!npc && !!rank && !saving;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready || !npc || !rank) return;
    setSaving(true);
    try {
      let entryId: string;
      if ("create" in npc) {
        if (!uid || !categoryId) return;
        const { readPermissions, editPermissions } =
          getWorldEntryVisibilityPermissions("everyone");
        entryId = await createEntry(
          uid,
          worldId,
          categoryId,
          npc.create,
          readPermissions,
          editPermissions,
        );
      } else {
        entryId = npc.entryId;
      }
      const created = await onCreate({
        entryId,
        gameId,
        characterId: forParty ? null : characterId,
        rank,
      });
      if (created) onClose();
    } catch (error) {
      parseRepositoryErrorAndCreateSnackbar(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={getDialogFormSlotProps(handleSubmit)}
    >
      <DialogTitleWithCloseButton onClose={onClose}>
        {t("character.connections.new-title", "New Connection")}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete<NpcOption>
            options={options}
            value={npc}
            onChange={(_, next) => setNpc(next)}
            inputValue={input}
            onInputChange={(_, next) => setInput(next)}
            isOptionEqualToValue={(a, b) =>
              "entryId" in a && "entryId" in b
                ? a.entryId === b.entryId
                : "create" in a && "create" in b && a.create === b.create
            }
            getOptionLabel={(option) =>
              "create" in option
                ? t("character.connections.create-npc", 'Create "{{name}}"', {
                    name: option.create,
                  })
                : option.name
            }
            filterOptions={(list) => {
              const search = query.toLowerCase();
              const matches = list.filter(
                (option) =>
                  "entryId" in option &&
                  option.name.toLowerCase().includes(search),
              );
              const exists = Object.values(entries).some(
                (entry) =>
                  entry.worldId === worldId &&
                  entry.name.toLowerCase() === search,
              );
              return canCreateEntry &&
                bondCategories.length > 0 &&
                search &&
                !exists
                ? [...matches, { create: query }]
                : matches;
            }}
            noOptionsText={t(
              "character.connections.no-npcs",
              "Type a name to add an NPC",
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                label={t("character.connections.npc", "NPC")}
              />
            )}
          />
          {npc && "create" in npc && bondCategories.length > 1 && (
            <TextField
              select
              label={t("character.connections.category", "Add to")}
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              {bondCategories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          {canShare && (
            <TextField
              select
              label={t("character.connections.for", "For")}
              value={owner}
              onChange={(event) => {
                setOwner(event.target.value);
                setNpc(null);
              }}
            >
              <MenuItem value={characterId}>{characterName}</MenuItem>
              <MenuItem value={PARTY}>
                {t("character.connections.for-party", "The party")}
              </MenuItem>
            </TextField>
          )}
          <TextField
            select
            required
            label={t("worlds.bonds.rank", "Rank")}
            value={rank}
            onChange={(event) => setRank(event.target.value as Difficulty)}
          >
            {CONNECTION_RANKS.map((option) => (
              <MenuItem key={option} value={option}>
                {getRankLabel(option, t)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button type="submit" variant="contained" disabled={!ready}>
          {saving
            ? t("character.connections.creating", "Creating Connection")
            : t("character.connections.create", "Create Connection")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
