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
import { Spinner } from "../../components/Spinner";
import { RollCardAction } from "../RollCard/RollCard";
import { RollTextOverrides } from "../RollCard/getRollSummary";
import { RollData } from "../RollCard/rollTypes";
import { GameLogComposer, GameLogComposerProps } from "./GameLogComposer";
import { GameLogItem } from "./GameLogItem";
import {
  GAME_LOG_GROUP_WINDOW_MS,
  getGameLogGroupPositions,
} from "./gameLogGroups";
import { GameLogStrings, defaultGameLogStrings } from "./gameLogStrings";
import { sameDay } from "./gameLogTime";

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
