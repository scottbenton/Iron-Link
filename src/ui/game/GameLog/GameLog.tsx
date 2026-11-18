import { ChatCircle, LockSimple } from "@phosphor-icons/react";
import {
  CSSProperties,
  Fragment,
  ReactNode,
  UIEvent,
  useLayoutEffect,
  useRef,
} from "react";

import { css, cx } from "styled-system/css";

import { Button } from "../../components/Button";
import { Spinner } from "../../components/Spinner";
import { VisuallyHidden } from "../../components/VisuallyHidden";
import {
  RollCard,
  RollCardAction,
  RollCardDiceDetail,
} from "../RollCard/RollCard";
import { RollTextOverrides } from "../RollCard/getRollSummary";
import { RollData } from "../RollCard/rollTypes";
import { GameLogComposer, GameLogComposerProps } from "./GameLogComposer";
import { GameLogStrings, defaultGameLogStrings } from "./gameLogStrings";

export interface GameLogAuthor {
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

const listStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
  marginBlock: 0,
  padding: 0,
  listStyle: "none",
});

const dayStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  marginBlock: "1",
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
  "&[data-you]": { alignItems: "flex-end" },
});

const metaStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  columnGap: "1.5",
  rowGap: "0.5",
  maxWidth: "100%",
  fontSize: "xs",
  lineHeight: "snug",
  color: "fg.muted",
  "[data-you] > &": { justifyContent: "flex-end" },
});

// The stacked header: portrait beside two lines, the character's name over
// the player's name and the time. The viewer's own mirrors it on the right.
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

const separatorStyles = css({ color: "fg.subtle" });

const nameStyles = css({
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "sm",
  color: "fg.default",
});

const guideStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  paddingInline: "1.5",
  borderRadius: "full",
  background: "info.soft",
  color: "info.fg",
  fontWeight: "semibold",
  "& svg": { width: "1.1em", height: "1.1em" },
});

// Messages are filled and borderless, so they read as talk beside the
// bordered roll cards: grey for others, the accent tint for yours.
const bubbleStyles = css({
  maxWidth: "var(--game-log-entry-max)",
  paddingBlock: "2",
  paddingInline: "3",
  borderRadius: "lg",
  borderTopLeftRadius: "xs",
  background: "bg.emphasized",
  fontSize: "sm",
  lineHeight: "normal",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  "[data-you] &": {
    borderTopLeftRadius: "lg",
    borderTopRightRadius: "xs",
    background: "accent.soft",
  },
  "[data-guide-only] &": {
    outline: "1px dashed token(colors.info.fg)",
    outlineOffset: "2px",
  },
});

const rollStyles = css({
  "--roll-card-max-width": "var(--game-log-entry-max)",
  "[data-guide-only] &": {
    outline: "1px dashed token(colors.info.fg)",
    outlineOffset: "2px",
  },
});

// Portraits come in at 32px (`CharacterPortrait` size `sm`): the stacked
// header shows them at that size, the inline one scales them to 20px.
const portraitStyles = css({
  "--log-portrait-size": "20px",
  position: "relative",
  display: "grid",
  placeItems: "center",
  flex: "none",
  width: "var(--log-portrait-size)",
  height: "var(--log-portrait-size)",
  borderRadius: "full",
  overflow: "hidden",
  background: "bg.emphasized",
  color: "fg.muted",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "2xs",
  "& > img": { width: "100%", height: "100%", objectFit: "cover" },
  "& > :not(img)": {
    position: "absolute",
    top: "50%",
    left: "50%",
    translate: "-50% -50%",
    scale: "0.625",
  },
  "&[data-size=stacked]": {
    "--log-portrait-size": "32px",
    fontSize: "xs",
    "& > :not(img)": { position: "static", translate: "none", scale: "none" },
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
  minHeight: "38px",
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

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/**
 * How much of each roll the log draws: `detailed` names every die,
 * `standard` draws bare dice, `quiet` keeps the outcome and writes the dice
 * as one line of numbers beside it.
 */
export type GameLogDensity = "detailed" | "standard" | "quiet";

/**
 * The header over each entry. `inline` puts portrait, name, player and time
 * on one line; `stacked` puts the character's name over the player's name
 * and the time, beside a larger portrait.
 */
export type GameLogHeader = "inline" | "stacked";

const diceDetailByDensity: Record<GameLogDensity, RollCardDiceDetail> = {
  detailed: "captions",
  standard: "dice",
  quiet: "numbers",
};

export interface GameLogProps {
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
  /** Time beside each entry, "8:42 PM". */
  formatTime?: (date: Date) => string;
  strings?: Partial<GameLogStrings>;
  composerProps?: Omit<GameLogComposerProps, "onSend">;
  /** Words for roll cards and their summaries. */
  rollText?: RollTextOverrides;
  /** How much of each roll to draw. `standard` by default. */
  density?: GameLogDensity;
  /** How each entry names its author. `inline` by default. */
  header?: GameLogHeader;
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
    density = "standard",
    header = "inline",
    maxContentWidth,
    className,
  } = props;
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
            {entries.map((entry) => {
              const showDay = !previous || !sameDay(previous, entry.timestamp);
              previous = entry.timestamp;
              return (
                <Fragment key={entry.id}>
                  {showDay && (
                    <li className={dayStyles}>{formatDay(entry.timestamp)}</li>
                  )}
                  <GameLogItem
                    entry={entry}
                    time={formatTime(entry.timestamp)}
                    strings={strings}
                    rollText={rollText}
                    diceDetail={diceDetailByDensity[density]}
                    header={header}
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
  time: string;
  strings: GameLogStrings;
  rollText?: RollTextOverrides;
  diceDetail: RollCardDiceDetail;
  header: GameLogHeader;
}

function GameLogItem(props: GameLogItemProps) {
  const { entry, time, strings, rollText, diceDetail, header } = props;
  const { author } = entry;

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
  const timeElement = (
    <time dateTime={entry.timestamp.toISOString()}>{time}</time>
  );
  const guideBadge = entry.guideOnly && (
    <span className={guideStyles}>
      <LockSimple weight="bold" />
      {strings.guideOnly}
    </span>
  );

  return (
    <li
      className={entryStyles}
      data-you={author.isYou || undefined}
      data-guide-only={entry.guideOnly || undefined}
    >
      {header === "stacked" ? (
        <div className={stackedMetaStyles} aria-hidden>
          <span className={portraitStyles} data-size="stacked">
            {portrait}
          </span>
          <span className={stackedTextStyles}>
            <span className={stackedNameStyles}>{author.name}</span>
            <span className={stackedSubStyles}>
              {author.writtenBy && (
                <>
                  <span>{author.writtenBy}</span>
                  <span className={separatorStyles}>·</span>
                </>
              )}
              {timeElement}
              {guideBadge}
            </span>
          </span>
        </div>
      ) : (
        <div className={metaStyles} aria-hidden>
          <span className={portraitStyles}>{portrait}</span>
          <span className={nameStyles}>{author.name}</span>
          {author.writtenBy && <span>{author.writtenBy}</span>}
          {timeElement}
          {guideBadge}
        </div>
      )}
      {entry.kind === "roll" ? (
        <RollCard
          roll={entry.roll}
          variant="compact"
          width="content"
          diceDetail={diceDetail}
          actions={entry.actions}
          summaryPrefix={heading}
          text={rollText}
          className={rollStyles}
        />
      ) : (
        <>
          <VisuallyHidden>{`${heading}.`}</VisuallyHidden>
          <div className={bubbleStyles}>{entry.message}</div>
        </>
      )}
    </li>
  );
}
