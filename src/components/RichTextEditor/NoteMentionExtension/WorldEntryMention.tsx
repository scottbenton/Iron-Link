import AtIcon from "@mui/icons-material/AlternateEmail";
import { Chip } from "@mui/material";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import { useWorldEntryMentionLinks } from "./worldEntryMentionLinks";

// A mention of a world entry, named from the entries this client can read so
// renames show at once. An entry that is gone or hidden from this reader is
// "Unavailable entry" and never shows its name.
export function WorldEntryMention({ entryId }: { entryId: string }) {
  const { t } = useTranslation();
  const entry = useWorldEntriesStore(
    (store) => store.entryState.entries[entryId],
  );
  const loading = useWorldEntriesStore((store) => store.entryState.loading);
  const getLinkProps = useWorldEntryMentionLinks();

  if (!entry) {
    return (
      <Chip
        icon={<AtIcon />}
        size="small"
        color={loading ? "default" : "error"}
        variant={loading ? "outlined" : "filled"}
        label={
          loading
            ? t("worlds.mentions.loading", "Loading entry")
            : t("worlds.mentions.unavailable", "Unavailable entry")
        }
      />
    );
  }

  if (!getLinkProps) {
    return <Chip icon={<AtIcon />} size="small" label={entry.name} />;
  }

  return (
    <Chip
      icon={<AtIcon />}
      size="small"
      label={entry.name}
      clickable
      component={LinkComponent}
      {...getLinkProps({
        type: "entry",
        categoryId: entry.categoryId,
        entryId: entry.id,
      })}
    />
  );
}
