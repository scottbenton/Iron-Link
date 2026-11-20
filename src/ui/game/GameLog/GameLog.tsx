import { ChatCircle } from "@phosphor-icons/react";
import {
  CSSProperties,
  Fragment,
  ReactNode,
  UIEvent,
  useLayoutEffect,
  useRef,
} from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cx } from "styled-system/css";

import { Button } from "../../components/Button";
import { RelativeTime } from "../../components/RelativeTime";
import { Spinner } from "../../components/Spinner";
import { VisuallyHidden } from "../../components/VisuallyHidden";
import { RollCard, RollCardAction } from "../RollCard/RollCard";
import { RollTextOverrides } from "../RollCard/getRollSummary";
import { RollData } from "../RollCard/rollTypes";
import { SecretCard } from "../SecretCard";
import { GameLogComposer, GameLogComposerProps } from "./GameLogComposer";
import {
  GAME_LOG_GROUP_WINDOW_MS,
  GameLogGroupPosition,
  getGameLogGroupPositions,
} from "./gameLogGroups";
import { GameLogStrings, defaultGameLogStrings } from "./gameLogStrings";
import { formatGameLogRelativeTime, sameDay } from "./gameLogTime";

export interface GameLogAuthor {
  /**
   * Who this is, so back-to-back entries group by author. The name stands in
   * without one.
   */
  id?: string;
  /** The character, or the player when no character wrote it. */
  name: string;
  /** A portrait or avatar. Initials stand in without one. */
  portrait?: ReactNode;
  /** Who wrote it for the character's owner: "rolled by Scott". */
  writtenBy?: string;
  /** The person viewing wrote it: their entries sit on the right. */
  isYou?: boolean;
}

interface GameLogEntryBase {
  id: string;
  author: GameLogAuthor;
  timestamp: Date;
  /** Only Guides can see it. */
  guideOnly?: boolean;
}

export interface GameLogRollEntry extends GameLogEntryBase {
  kind: "roll";
  roll: RollData;
  /** Reroll, Burn Momentum, Copy. */
  actions?: RollCardAction[];
}

export interface GameLogMessageEntry extends GameLogEntryBase {
  kind: "message";
  /** Plain text keeps its line breaks; pass rich content as a node. */
  message: ReactNode;
}

export type GameLogEntry = GameLogRollEntry | GameLogMessageEntry;

const rootStyles = css({
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  height: "100%",
  background: "bg.surface",
  color: "fg.default",
});

const scrollerStyles = css({
  flex: "1",
  minHeight: 0,
  overflowY: "auto",
  overscrollBehavior: "contain",
  paddingInline: "3",
  paddingBlock: "3",
});

// Wide places (a notes tab) cap the entries and composer to a centred rail.
const railStyles = css({
  width: "100%",
  maxWidth: "var(--game-log-rail, none)",
  marginInline: "auto",
});

// Entries are spaced apart so each time reads with its own card, and an
// author's back-to-back entries sit close together as one group.
const listStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "1",
  marginBlock: 0,
  padding: 0,
  listStyle: "none",
});

const dayStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  marginBlockStart: "4",
  marginBlockEnd: "2",
  "&:first-child": { marginBlockStart: 0 },
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "xs",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "fg.muted",
  _before: {
    content: '""',
    flex: "1",
    height: "1px",
    background: "border.subtle",
  },
  _after: {
    content: '""',
    flex: "1",
    height: "1px",
    background: "border.subtle",
  },
});

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

const emptyStyles = css({
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "2",
  height: "100%",
  minHeight: "200px",
  paddingInline: "6",
  textAlign: "center",
  color: "fg.muted",
  "& > svg": { width: "32px", height: "32px", color: "fg.subtle" },
});

const emptyTitleStyles = css({
  margin: 0,
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "lg",
  color: "fg.default",
});

const emptyTextStyles = css({
  margin: 0,
  maxWidth: "32ch",
  fontSize: "sm",
  textWrap: "balance",
});

const footStyles = css({
  flex: "none",
  paddingInline: "3",
  paddingBottom: "3",
  paddingTop: "2",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.subtle",
});

const moreStyles = css({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "2",
  minHeight: "control.md",
  marginBottom: "3",
  fontSize: "sm",
  color: "fg.muted",
});

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return letters.map((word) => word[0]?.toUpperCase() ?? "").join("");
}

export interface GameLogProps extends CssProp {
  /** Entries oldest first; the newest sits at the bottom by the composer. */
  entries: GameLogEntry[];
  /** Sends a message. Without it there is no composer (viewers). */
  onSend?: GameLogComposerProps["onSend"];
  /** More entries before the first; shows Load Earlier Entries. */
  hasMore?: boolean;
  onLoadMore?: () => void;
  /** Entries are loading (shown at the top). */
  loading?: boolean;
  /** Day separator text. Today, Yesterday, then the weekday and date. */
  formatDay?: (date: Date) => string;
  /**
   * The clock time of each entry, "8:42 PM". Entries show a relative time
   * ("5 minutes ago") with this on hover; entries from before today show it
   * outright. Relative times keep themselves up to date from a shared clock
   * (`RelativeTime`), so a tick re-renders the time labels, not the log.
   */
  formatTime?: (date: Date) => string;
  strings?: Partial<GameLogStrings>;
  composerProps?: Omit<GameLogComposerProps, "onSend">;
  /** Words for roll cards and their summaries. */
  rollText?: RollTextOverrides;
  /**
   * One author's entries this close together (in minutes) group: one
   * header over the first, one time under the last. 5 by default; 0 turns
   * grouping off. Screen readers still hear who and when for every entry.
   */
  groupWithinMinutes?: number;
  /**
   * The widest the entries and composer grow, centred, for a log shown in
   * a wide column such as a notes tab ("640px"). Full width by default.
   */
  maxContentWidth?: string;
  className?: string;
}

/**
 * The game log: rolls and chat messages in time order with day separators,
 * Guide only entries marked, and a message composer at the bottom. It stays
 * scrolled to the newest entry unless the reader has scrolled up.
 */
export function GameLog(props: GameLogProps) {
  const {
    entries,
    onSend,
    hasMore,
    onLoadMore,
    loading,
    formatDay: formatDayProp,
    formatTime = (date) =>
      date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }),
    strings: stringsProp,
    composerProps,
    rollText,
    groupWithinMinutes = GAME_LOG_GROUP_WINDOW_MS / 60_000,
    maxContentWidth,
    className,
  } = withCssProp<GameLogProps>(props);
  const strings = { ...defaultGameLogStrings, ...stringsProp };

  const formatDay =
    formatDayProp ??
    ((date: Date) => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      if (sameDay(date, today)) return strings.today;
      if (sameDay(date, yesterday)) return strings.yesterday;
      return date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    });

  const scrollerRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);
  const lastId = entries[entries.length - 1]?.id;

  // Keep the newest entry in view as entries arrive, unless the reader has
  // scrolled up to read older ones.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller && pinnedToBottom.current) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [lastId]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    pinnedToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  };

  let previous: Date | undefined;
  const groupPositions = getGameLogGroupPositions(
    entries,
    groupWithinMinutes * 60_000,
  );

  return (
    <section
      aria-label={strings.label}
      className={cx(rootStyles, className)}
      style={
        maxContentWidth
          ? ({ "--game-log-rail": maxContentWidth } as CSSProperties)
          : undefined
      }
    >
      <div
        ref={scrollerRef}
        className={scrollerStyles}
        onScroll={handleScroll}
        tabIndex={0}
        aria-label={strings.label}
        role="region"
      >
        {(loading || hasMore) && (
          <div className={cx(moreStyles, railStyles)}>
            {loading ? (
              <>
                <Spinner />
                {strings.loading}
              </>
            ) : (
              onLoadMore && (
                <Button size="sm" variant="ghost" onClick={onLoadMore}>
                  {strings.loadEarlier}
                </Button>
              )
            )}
          </div>
        )}

        {entries.length === 0 && !loading ? (
          <div className={emptyStyles}>
            <ChatCircle aria-hidden />
            <p className={emptyTitleStyles}>{strings.emptyTitle}</p>
            <p className={emptyTextStyles}>{strings.emptyText}</p>
          </div>
        ) : (
          <ol className={cx(listStyles, railStyles)}>
            {entries.map((entry, index) => {
              const showDay = !previous || !sameDay(previous, entry.timestamp);
              previous = entry.timestamp;
              return (
                <Fragment key={entry.id}>
                  {showDay && (
                    <li className={dayStyles} data-day="">
                      {formatDay(entry.timestamp)}
                    </li>
                  )}
                  <GameLogItem
                    entry={entry}
                    time={formatTime(entry.timestamp)}
                    strings={strings}
                    rollText={rollText}
                    groupPosition={groupPositions[index]}
                  />
                </Fragment>
              );
            })}
          </ol>
        )}
      </div>

      {onSend && (
        <div className={footStyles}>
          <div className={railStyles}>
            <GameLogComposer onSend={onSend} {...composerProps} />
          </div>
        </div>
      )}
    </section>
  );
}

interface GameLogItemProps {
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

function GameLogItem(props: GameLogItemProps) {
  const { entry, time, strings, rollText, groupPosition } = props;
  const { author } = entry;
  // A group shows its header over its first entry and its time under its
  // last.
  const showHeader = groupPosition === "single" || groupPosition === "first";
  const showTime = groupPosition === "single" || groupPosition === "last";

  // Who wrote it and when, read with the entry as one piece of text; the
  // name and time shown around it are hidden from screen readers.
  const heading = [
    author.writtenBy ? `${author.name}, ${author.writtenBy}` : author.name,
    time,
    entry.guideOnly ? strings.guideOnly : undefined,
  ]
    .filter(Boolean)
    .join(", ");

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
