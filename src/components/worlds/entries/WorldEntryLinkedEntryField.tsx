import { Autocomplete, Box, Chip, TextField } from "@mui/material";
import { type Key, type SyntheticEvent, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { useUID } from "stores/auth.store";
import {
  useWorldPermission,
  useWorldPermissionControlsShown,
} from "stores/world.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import {
  type ResolvedWorldFieldDefinition,
  WORLD_FIELD_VALUE_MAX_LENGTH,
} from "lib/worldFieldRules";

import { WorldPermission, isGuideEquivalent } from "repositories/shared.types";

import type { IWorldEntry } from "services/worldEntries.service";
import type { WorldFieldValue } from "services/worldEntryFieldValues.service";

import type { WorldNavigation } from "../worldNavigation";
import { WorldEntryLabelledField } from "./WorldEntryLabelledField";
import { getWorldFieldValueList } from "./worldEntryFieldValue";
import { getLinkedWorldEntryPermissions } from "./worldEntryPermissions";

// Never an entry ID, so it cannot collide with a real option.
const CREATE_OPTION = "create-entry";

// Links entries from the field's target category, shown as chips that open
// them. Links to entries this person cannot read stay hidden and are kept
// whenever the field saves. Anyone who can add entries can also create one
// by name and link it without leaving this entry.
export function WorldEntryLinkedEntryField({
  entry,
  field,
  value,
  canEdit,
  navigation,
  onSave,
  onError,
}: {
  entry: IWorldEntry;
  field: ResolvedWorldFieldDefinition;
  value: WorldFieldValue | null | undefined;
  canEdit: boolean;
  navigation: WorldNavigation;
  onSave: (value: WorldFieldValue | null) => void;
  onError: (cause: unknown) => void;
}) {
  const { t } = useTranslation();
  const uid = useUID();
  const permission = useWorldPermission();
  const controlsShown = useWorldPermissionControlsShown();
  const createEntry = useWorldEntriesStore((store) => store.createEntry);
  const targetCategoryId = field.configuration.targetCategoryId ?? "";
  const targets = useWorldEntriesStore((store) =>
    Object.values(store.entryState.entries)
      .filter((target) => target.categoryId === targetCategoryId)
      .map((target) => ({ id: target.id, name: target.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
  const [inputValue, setInputValue] = useState("");
  const [creating, setCreating] = useState(false);

  // Stable between renders: the autocomplete clears typed text whenever its
  // value changes identity.
  const { names, shown, unseen } = useMemo(() => {
    const names: Record<string, string> = Object.fromEntries(
      targets.map((target) => [target.id, target.name]),
    );
    const linked = getWorldFieldValueList(value);
    return {
      names,
      shown: linked.filter((id) => id in names),
      unseen: linked.filter((id) => !(id in names)),
    };
  }, [targets, value]);
  const multiple = !!field.configuration.multiple;
  const canCreate =
    !!uid &&
    !!permission &&
    permission !== WorldPermission.None &&
    permission !== WorldPermission.Viewer;

  const renderChip = (
    id: string,
    key: Key,
    onDelete?: (event: SyntheticEvent) => void,
    props?: object,
  ) => (
    <Chip
      key={key}
      size="small"
      label={names[id]}
      clickable
      component={LinkComponent}
      {...navigation.getLinkProps({
        type: "entry",
        categoryId: targetCategoryId,
        entryId: id,
      })}
      {...props}
      // The chip is a link; removing it must not also follow it.
      onDelete={
        onDelete &&
        ((event: SyntheticEvent) => {
          event.preventDefault();
          onDelete(event);
        })
      }
    />
  );

  if (!canEdit) {
    return (
      <WorldEntryLabelledField label={field.label}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {shown.map((id) => renderChip(id, id))}
        </Box>
      </WorldEntryLabelledField>
    );
  }

  // A single link is replaced by the newest choice.
  const link = (chosen: string[]) => {
    if (multiple) onSave([...chosen, ...unseen]);
    else onSave(chosen.at(-1) ?? unseen[0] ?? null);
  };

  const create = async (name: string) => {
    if (!uid || !name) return;
    const { readPermissions, editPermissions } = getLinkedWorldEntryPermissions(
      t,
      entry,
      {
        uid,
        gmOnly: field.gmOnly,
        isGuide: !!permission && isGuideEquivalent(permission),
        permissionControlsShown: controlsShown,
      },
    );
    setCreating(true);
    try {
      const createdId = await createEntry(
        uid,
        entry.worldId,
        targetCategoryId,
        name,
        readPermissions,
        editPermissions,
      );
      setInputValue("");
      link([...shown, createdId]);
    } catch (cause) {
      onError(cause);
    } finally {
      setCreating(false);
    }
  };

  const query = inputValue.trim();
  return (
    <Autocomplete
      multiple
      filterSelectedOptions
      disabled={creating}
      options={targets.map((target) => target.id)}
      value={shown}
      inputValue={inputValue}
      onInputChange={(_, next) => setInputValue(next)}
      getOptionLabel={(id) =>
        id === CREATE_OPTION
          ? t("worlds.entries.create-linked", 'Create "{{name}}"', {
              name: query,
            })
          : (names[id] ?? "")
      }
      filterOptions={(options) => {
        const search = query.toLowerCase();
        const matches = options.filter((id) =>
          names[id]?.toLowerCase().includes(search),
        );
        const exists = targets.some(
          (target) => target.name.toLowerCase() === search,
        );
        return canCreate && search && !exists
          ? [...matches, CREATE_OPTION]
          : matches;
      }}
      onChange={(_, next) => {
        if (next.includes(CREATE_OPTION)) {
          create(query);
        } else {
          link(next);
        }
      }}
      // No chips must render nothing: any start adornment, even an empty
      // list, keeps the label raised over an empty field.
      renderValue={(values, getItemProps) =>
        values.length === 0
          ? null
          : values.map((id, index) => {
              const { key, onDelete, ...itemProps } = getItemProps({ index });
              return renderChip(id, key, onDelete, itemProps);
            })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          inputProps={{
            ...params.inputProps,
            maxLength: WORLD_FIELD_VALUE_MAX_LENGTH,
          }}
          label={field.label}
          helperText={field.helpText || undefined}
        />
      )}
    />
  );
}
