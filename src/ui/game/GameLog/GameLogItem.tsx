import { css, cx } from "styled-system/css";

import { RelativeTime } from "../../components/RelativeTime";
import { VisuallyHidden } from "../../components/VisuallyHidden";
import { RollCard } from "../RollCard/RollCard";
import { RollTextOverrides } from "../RollCard/getRollSummary";
import { SecretCard } from "../SecretCard";
import type { GameLogEntry } from "./GameLog";
import { GameLogGroupPosition } from "./gameLogGroups";
import { getGameLogHeading } from "./gameLogHeading";
import { GameLogStrings } from "./gameLogStrings";
import { formatGameLogRelativeTime } from "./gameLogTime";

// Entries stack: who and when above, the roll or message below. Like a
// chat, each sits on its author's side, the viewer's on the right, and
// rolls and messages alike are as wide as what they show, up to a cap that
// leaves a gap on the far side so the side still reads in a narrow column.
const entryStyles = css({
  "--game-log-entry-max": "min(100% - 32px, 400px)",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "1",
  minWidth: 0,
  marginBlockStart: "4",
  "&:first-child, [data-day] + &, &[data-continued]": { marginBlockStart: 0 },
  "&[data-you]": { alignItems: "flex-end" },
});

// The header: portrait beside two lines, the character's name over
// the player's name. The viewer's own mirrors it on the right.
const stackedMetaStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  maxWidth: "100%",
  minWidth: 0,
  "[data-you] > &": { flexDirection: "row-reverse", textAlign: "end" },
});

const stackedTextStyles = css({
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  overflowWrap: "anywhere",
  "[data-you] &": { alignItems: "flex-end" },
});

const stackedNameStyles = css({
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "sm",
  lineHeight: "tight",
  color: "fg.default",
});

const stackedSubStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  columnGap: "1.5",
  rowGap: "0.5",
  fontSize: "xs",
  lineHeight: "snug",
  color: "fg.muted",
  "[data-you] &": { justifyContent: "flex-end" },
});

// The time under a roll or message: small and quiet, on the entry's side.
const timeBelowStyles = css({
  fontSize: "2xs",
  lineHeight: "snug",
  color: "fg.subtle",
  fontVariantNumeric: "tabular-nums",
  paddingInline: "1",
});

const messageTextStyles = css({
  fontSize: "sm",
  lineHeight: "normal",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
});

// Messages are filled and borderless, so they read as talk beside the
// bordered roll cards: grey for others, the accent tint for yours.
const bubbleStyles = css({
  maxWidth: "var(--game-log-entry-max)",
  paddingBlock: "2",
  paddingInline: "3",
  borderRadius: "lg",
  background: "bg.emphasized",
  "[data-you] &": { background: "accent.soft" },
});

const rollStyles = css({
  "--roll-card-max-width": "var(--game-log-entry-max)",
});

// Guide only entries wear the secret style used across Iron Link.
const guideCardStyles = css({ maxWidth: "var(--game-log-entry-max)" });

// A Guide only roll is one card, not a card in a card: the secret frame is
// the roll's frame, and the roll card inside drops its own border and fill
// and keeps its padding, so it fills the frame edge to edge. The doubled
// attribute selector outranks RollCard's own compact rules (one class and
// one attribute) whatever order Panda writes them in.
const guideRollStyles = css({
  "--roll-card-max-width": "100%",
  "&[data-variant][data-width]": {
    borderWidth: "0",
    borderRadius: "0",
    background: "transparent",
    width: "100%",
    // The secret header's height already spaces the roll from it.
    paddingBlockStart: "0",
  },
});

// Portraits come in at 32px (`CharacterPortrait` size `sm`).
const portraitStyles = css({
  display: "grid",
  placeItems: "center",
  flex: "none",
  width: "32px",
  height: "32px",
  borderRadius: "full",
  overflow: "hidden",
  background: "bg.emphasized",
  color: "fg.muted",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "xs",
  "& > img": { width: "100%", height: "100%", objectFit: "cover" },
});

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return letters.map((word) => word[0]?.toUpperCase() ?? "").join("");
}

export interface GameLogItemProps {
  entry: GameLogEntry;
  /**
   * The clock time, read by screen readers. A relative time shows in its
   * place, with it on hover, until the entry is from before today.
   */
  time: string;
  strings: GameLogStrings;
  rollText?: RollTextOverrides;
  groupPosition: GameLogGroupPosition;
}

export function GameLogItem(props: GameLogItemProps) {
  const { entry, time, strings, rollText, groupPosition } = props;
  const { author } = entry;
  // A group shows its header over its first entry and its time under its
  // last.
  const showHeader = groupPosition === "single" || groupPosition === "first";
  const showTime = groupPosition === "single" || groupPosition === "last";

  // Who wrote it and when, read with the entry as one piece of text; the
  // name and time shown around it are hidden from screen readers.
  const heading = getGameLogHeading(entry, time, strings);

  const portrait = author.portrait ?? initials(author.name);
  const content =
    entry.kind === "roll" ? (
      <RollCard
        roll={entry.roll}
        variant="compact"
        width="content"
        actions={entry.actions}
        summaryPrefix={heading}
        text={rollText}
        className={entry.guideOnly ? guideRollStyles : rollStyles}
      />
    ) : (
      <>
        <VisuallyHidden>{`${heading}.`}</VisuallyHidden>
        {entry.guideOnly ? (
          <span className={messageTextStyles}>{entry.message}</span>
        ) : (
          <div className={cx(bubbleStyles, messageTextStyles)}>
            {entry.message}
          </div>
        )}
      </>
    );

  return (
    <li
      className={entryStyles}
      data-you={author.isYou || undefined}
      data-guide-only={entry.guideOnly || undefined}
      data-continued={showHeader ? undefined : ""}
    >
      {showHeader && (
        <div className={stackedMetaStyles} aria-hidden>
          <span className={portraitStyles}>{portrait}</span>
          <span className={stackedTextStyles}>
            <span className={stackedNameStyles}>{author.name}</span>
            {author.writtenBy && (
              <span className={stackedSubStyles}>
                <span>{author.writtenBy}</span>
              </span>
            )}
          </span>
        </div>
      )}
      {entry.guideOnly ? (
        <SecretCard
          landmark={false}
          label={strings.guideOnly}
          padding={entry.kind === "roll" ? "none" : "default"}
          className={guideCardStyles}
        >
          {content}
        </SecretCard>
      ) : (
        content
      )}
      {showTime && (
        // A relative time shows the clock time on hover. Screen readers
        // read the clock time in the entry's heading, so this stays hidden.
        <div className={timeBelowStyles} aria-hidden>
          <RelativeTime
            date={entry.timestamp}
            absolute={time}
            format={(date, now) =>
              formatGameLogRelativeTime(date, now, strings.justNow)
            }
          />
        </div>
      )}
    </li>
  );
}
