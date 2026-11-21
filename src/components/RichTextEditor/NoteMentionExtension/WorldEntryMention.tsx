import AtIcon from "@mui/icons-material/AlternateEmail";
import { Chip, Tooltip, TooltipProps } from "@mui/material";
import { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";
import { WorldEntryHoverCard } from "components/worlds/entries/WorldEntryHoverCard";

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
    return (
      <WorldEntryHoverCardTooltip entry={entry}>
        <Chip icon={<AtIcon />} size="small" label={entry.name} />
      </WorldEntryHoverCardTooltip>
    );
  }

  return (
    <WorldEntryHoverCardTooltip entry={entry}>
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
    </WorldEntryHoverCardTooltip>
  );
}

// Hover or keyboard focus shows the entry's card after a short pause, the
// way a link preview does. Touch gets none: a tap already opens the entry.
function WorldEntryHoverCardTooltip({
  entry,
  children,
}: {
  entry: Parameters<typeof WorldEntryHoverCard>[0]["entry"];
  children: ReactElement;
}) {
  return (
    <Tooltip
      title={<WorldEntryHoverCard entry={entry} />}
      enterDelay={500}
      enterNextDelay={500}
      disableTouchListener
      placement="bottom-start"
      slotProps={HOVER_CARD_SLOT_PROPS}
    >
      {children}
    </Tooltip>
  );
}

const HOVER_CARD_SLOT_PROPS: TooltipProps["slotProps"] = {
  tooltip: {
    sx: {
      p: 0,
      maxWidth: 320,
      bgcolor: "background.paper",
      color: "text.primary",
      border: 1,
      borderColor: "divider",
      boxShadow: 4,
      typography: "body2",
    },
  },
};
