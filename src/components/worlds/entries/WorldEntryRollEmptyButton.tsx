import CasinoIcon from "@mui/icons-material/Casino";
import { Button } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import {
  getWorldFieldRollTarget,
  rollWorldFieldValue,
} from "lib/worldOracleRoll";

import { IWorldEntry } from "services/worldEntries.service";

import { useResolvedWorldEntryFields } from "./useResolvedWorldEntryFields";
import { useWorldOracleRoller } from "./useWorldOracleRoller";
import { hasWorldEntryFieldValue } from "./worldEntryFieldValue";

// Fills every empty field the entry can roll, and never touches one that
// holds a value. Shown only while there is such a field.
export function WorldEntryRollEmptyButton({
  entry,
  onError,
}: {
  entry: IWorldEntry;
  onError: (cause: unknown) => void;
}) {
  const { t } = useTranslation();
  const { fields, values, entries } = useResolvedWorldEntryFields(entry);
  const { catalog, lookup } = useWorldOracleRoller(entry.worldId);
  const setFieldValue = useWorldEntriesStore((store) => store.setFieldValue);
  const [rolling, setRolling] = useState(false);

  const empty = fields.filter(
    (field) =>
      getWorldFieldRollTarget(field, catalog) &&
      !hasWorldEntryFieldValue(field, values[field.id], entries),
  );
  if (!empty.length) return null;

  const handleRoll = async () => {
    setRolling(true);
    try {
      await Promise.all(
        empty.map((field) => {
          const value = rollWorldFieldValue(field, null, catalog, lookup);
          return value
            ? setFieldValue(entry.id, entry.worldId, field.id, value)
            : undefined;
        }),
      );
    } catch (cause) {
      onError(cause);
    } finally {
      setRolling(false);
    }
  };

  return (
    <Button
      color="inherit"
      startIcon={<CasinoIcon />}
      disabled={rolling}
      onClick={() => {
        handleRoll().catch(onError);
      }}
    >
      {t("worlds.entries.roll-empty", "Roll empty fields")}
    </Button>
  );
}
