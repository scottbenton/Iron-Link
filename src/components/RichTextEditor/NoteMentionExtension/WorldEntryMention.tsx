import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";
import { WorldEntryHoverCard } from "components/worlds/entries/WorldEntryHoverCard";

import { Chip } from "ui/components/Chip";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "ui/components/PreviewCard";
import { AtIcon } from "ui/icons";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import { useWorldEntryMentionLinks } from "./worldEntryMentionLinks";

// Hover or keyboard focus shows the entry's card after this pause, the way a
// link preview does. A tap opens the entry instead.
const HOVER_CARD_DELAY = 500;

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
    return loading ? (
      <Chip size="sm" icon={<AtIcon />}>
        {t("worlds.mentions.loading", "Loading entry")}
      </Chip>
    ) : (
      <Chip size="sm" variant="soft" tone="danger" icon={<AtIcon />}>
        {t("worlds.mentions.unavailable", "Unavailable entry")}
      </Chip>
    );
  }

  const card = (
    <PreviewCardContent side="bottom" align="start">
      <WorldEntryHoverCard entry={entry} />
    </PreviewCardContent>
  );

  if (!getLinkProps) {
    // Not a link here (the game log), so only a pointer can show the card.
    return (
      <PreviewCard>
        <PreviewCardTrigger delay={HOVER_CARD_DELAY} render={<span />}>
          <Chip size="sm" variant="soft" icon={<AtIcon />}>
            {entry.name}
          </Chip>
        </PreviewCardTrigger>
        {card}
      </PreviewCard>
    );
  }

  return (
    <PreviewCard>
      <Chip
        size="sm"
        variant="soft"
        icon={<AtIcon />}
        render={
          <PreviewCardTrigger
            delay={HOVER_CARD_DELAY}
            render={
              <LinkComponent
                {...getLinkProps({
                  type: "entry",
                  categoryId: entry.categoryId,
                  entryId: entry.id,
                })}
              />
            }
          />
        }
      >
        {entry.name}
      </Chip>
      {card}
    </PreviewCard>
  );
}
