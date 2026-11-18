import {
  ClockIcon,
  CompassIcon,
  FlagBannerIcon,
  ListChecksIcon,
  PlusIcon,
  ScrollIcon,
  SwordIcon,
} from "@phosphor-icons/react";
import { ReactNode, useEffect, useRef, useState } from "react";

import { css, cx } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuTrigger,
} from "../../components/Menu";
import { EmptyState } from "../../layout/EmptyState";
import type { ProgressRank } from "../ProgressTrack";
import { BondsSection } from "./BondsSection";
import { ConnectionsSection } from "./ConnectionsSection";
import { ClockEntry, ProgressTrackEntry } from "./TrackEntries";
import { TrackMenu } from "./TrackMenu";
import {
  TracksPanelStrings,
  defaultTracksPanelStrings,
} from "./tracksPanelStrings";
import type {
  BondItem,
  ConnectionItem,
  OracleOdds,
  ProgressTrackKind,
  TrackItem,
  TrackKind,
  TrackMove,
} from "./tracksPanelTypes";

const rootStyles = css({
  display: "grid",
  gap: "3",
  minWidth: 0,
});

const toolbarStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "2",
});

const listStyles = css({
  display: "grid",
  gap: "3",
  minWidth: 0,
  outline: "none",
});

const sectionsStyles = css({
  display: "grid",
  gap: "3",
  paddingBlockStart: "3",
});

const kindIcons: Record<TrackKind, ReactNode> = {
  vow: <ScrollIcon />,
  journey: <CompassIcon />,
  combat: <SwordIcon />,
  sceneChallenge: <FlagBannerIcon />,
  clock: <ClockIcon />,
};

const allKinds: TrackKind[] = [
  "vow",
  "journey",
  "combat",
  "sceneChallenge",
  "clock",
];

export interface TracksPanelProps {
  /** Vows, journeys, fights, scene challenges and clocks, in display order. */
  tracks: TrackItem[];
  /** A viewer's view: no Add, no marking, no menus or rolls. */
  readOnly?: boolean;

  showCompleted?: boolean;
  defaultShowCompleted?: boolean;
  onShowCompletedChange?: (show: boolean) => void;

  /** Add Track's menu; the button shows when given. */
  onAdd?: (kind: TrackKind) => void;
  /** The kinds Add Track offers; Ironsworn has no scene challenges. */
  addKinds?: TrackKind[];

  onTicksChange?: (id: string, ticks: number) => void;
  /** A clock's filled segments, or a scene challenge's tension. */
  onClockChange?: (id: string, value: number) => void;
  /** The moves that finish each kind of track, by the game's rules. */
  completionMoves?: Partial<Record<ProgressTrackKind, TrackMove[]>>;
  onRollMove?: (id: string, moveId: string) => void;
  /** Rolls a clock's progress on its odds. */
  onRollClock?: (id: string) => void;
  onOddsChange?: (id: string, odds: OracleOdds) => void;
  onEdit?: (id: string) => void;
  onCompletedChange?: (id: string, completed: boolean) => void;
  /** Called once the person confirms. */
  onDelete?: (id: string) => void;
  /** The track on the second screen. The menu offers it when set. */
  secondScreenTrackId?: string | null;
  onSecondScreenChange?: (id: string, open: boolean) => void;

  /** Starforged connections; the section shows when given. */
  connections?: ConnectionItem[];
  connectionMoves?: TrackMove[];
  showBonded?: boolean;
  defaultShowBonded?: boolean;
  onShowBondedChange?: (show: boolean) => void;
  onAddConnection?: () => void;
  onConnectionTicksChange?: (id: string, ticks: number) => void;
  onConnectionBondedChange?: (id: string, bonded: boolean) => void;
  onConnectionRankChange?: (id: string, rank: ProgressRank) => void;
  onConnectionAction?: (id: string, key: string) => void;
  onRollConnection?: (id: string, moveId: string) => void;

  /** Ironsworn bonds; the section shows when given. */
  bonds?: BondItem[];
  onClearBond?: (id: string) => void;

  /** The Connections and Bonds headings; h3 under a column's h2. */
  headingAs?: "h2" | "h3" | "h4";
  rankLabels?: Partial<Record<ProgressRank, string>>;
  strings?: Partial<TracksPanelStrings>;
  className?: string;
}

/**
 * The character sheet's Tracks tab: Show Completed and Add Track, then the
 * game's vows, journeys, fights, scene challenges and clocks, then the
 * character's connections or bonds. Every track keeps marking progress and
 * its completion roll on the card; editing, completing, the second screen
 * and deleting sit in its menu. Data and changes go through props.
 */
export function TracksPanel(props: TracksPanelProps) {
  const {
    tracks,
    readOnly = false,
    showCompleted: showCompletedProp,
    defaultShowCompleted = false,
    onShowCompletedChange,
    onAdd,
    addKinds = allKinds,
    onTicksChange,
    onClockChange,
    completionMoves = {},
    onRollMove,
    onRollClock,
    onOddsChange,
    onEdit,
    onCompletedChange,
    onDelete,
    secondScreenTrackId,
    onSecondScreenChange,
    connections,
    connectionMoves = [],
    showBonded,
    defaultShowBonded,
    onShowBondedChange,
    onAddConnection,
    onConnectionTicksChange,
    onConnectionBondedChange,
    onConnectionRankChange,
    onConnectionAction,
    onRollConnection,
    bonds,
    onClearBond,
    headingAs = "h3",
    rankLabels,
    strings: stringsProp,
    className,
  } = props;
  const strings = { ...defaultTracksPanelStrings, ...stringsProp };
  const announce = useAnnounce();
  const listRef = useRef<HTMLDivElement>(null);

  const [ownShowCompleted, setOwnShowCompleted] =
    useState(defaultShowCompleted);
  const showCompleted = showCompletedProp ?? ownShowCompleted;
  const setShowCompleted = (show: boolean) => {
    setOwnShowCompleted(show);
    onShowCompletedChange?.(show);
  };

  // The track being deleted stays set until the dialog has closed, so its
  // text doesn't change during the exit.
  const [deleting, setDeleting] = useState<TrackItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deletedRef = useRef(false);

  // A track that leaves the list (completed while completed ones are
  // hidden) takes its menu's button with it; focus the list instead of
  // letting focus fall to the page.
  const [refocus, setRefocus] = useState(0);
  useEffect(() => {
    if (!refocus) return;
    const frame = requestAnimationFrame(() => {
      const active = document.activeElement;
      if (!active || active === document.body) listRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [refocus]);

  const shown = tracks.filter((track) => showCompleted || !track.completed);
  const hiddenCount = tracks.length - shown.length;

  const completedChange = (track: TrackItem, completed: boolean) => {
    onCompletedChange?.(track.id, completed);
    announce(
      completed
        ? strings.completedAnnouncement(track.label)
        : strings.reopenedAnnouncement(track.label),
    );
    if (completed && !showCompleted) setRefocus((count) => count + 1);
  };

  const menuFor = (track: TrackItem) =>
    readOnly && !onSecondScreenChange ? undefined : (
      <TrackMenu
        label={track.label}
        isClock={track.kind === "clock"}
        completed={!!track.completed}
        onEdit={!readOnly && onEdit ? () => onEdit(track.id) : undefined}
        onCompletedChange={
          !readOnly && onCompletedChange
            ? (completed) => completedChange(track, completed)
            : undefined
        }
        onDelete={
          !readOnly && onDelete
            ? () => {
                setDeleting(track);
                setConfirmOpen(true);
              }
            : undefined
        }
        onSecondScreen={secondScreenTrackId === track.id}
        onSecondScreenChange={
          onSecondScreenChange
            ? (open) => onSecondScreenChange(track.id, open)
            : undefined
        }
        strings={strings}
      />
    );

  return (
    <div className={cx(rootStyles, className)}>
      <div className={toolbarStyles}>
        <Checkbox
          label={strings.showCompleted}
          size="sm"
          checked={showCompleted}
          onCheckedChange={setShowCompleted}
        />
        {!readOnly && onAdd && (
          <Menu>
            <MenuTrigger render={<Button size="sm" startIcon={<PlusIcon />} />}>
              {strings.addTrack}
            </MenuTrigger>
            <MenuContent align="end">
              <MenuGroup label={strings.addTrackMenu}>
                {addKinds.map((kind) => (
                  <MenuItem
                    key={kind}
                    icon={kindIcons[kind]}
                    onClick={() => onAdd(kind)}
                  >
                    {strings.kindLabels[kind]}
                  </MenuItem>
                ))}
              </MenuGroup>
            </MenuContent>
          </Menu>
        )}
      </div>

      <div ref={listRef} tabIndex={-1} className={listStyles}>
        {shown.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<ListChecksIcon />}
            title={
              tracks.length === 0 ? strings.noTracks : strings.noActiveTracks
            }
            message={
              tracks.length === 0
                ? readOnly || !onAdd
                  ? undefined
                  : strings.noTracksMessage
                : strings.noActiveTracksMessage(hiddenCount)
            }
          />
        ) : (
          shown.map((track) =>
            track.kind === "clock" ? (
              <ClockEntry
                key={track.id}
                clock={track}
                editable={!readOnly}
                menu={menuFor(track)}
                onValueChange={
                  onClockChange
                    ? (value) => onClockChange(track.id, value)
                    : undefined
                }
                onRoll={onRollClock ? () => onRollClock(track.id) : undefined}
                onOddsChange={
                  onOddsChange
                    ? (odds) => onOddsChange(track.id, odds)
                    : undefined
                }
                strings={strings}
              />
            ) : (
              <ProgressTrackEntry
                key={track.id}
                track={track}
                editable={!readOnly}
                menu={menuFor(track)}
                moves={completionMoves[track.kind] ?? []}
                onTicksChange={
                  onTicksChange
                    ? (ticks) => onTicksChange(track.id, ticks)
                    : undefined
                }
                onTensionChange={
                  onClockChange
                    ? (value) => onClockChange(track.id, value)
                    : undefined
                }
                onRollMove={
                  onRollMove
                    ? (moveId) => onRollMove(track.id, moveId)
                    : undefined
                }
                rankLabels={rankLabels}
                strings={strings}
              />
            ),
          )
        )}
      </div>

      {(bonds || connections) && (
        <div className={sectionsStyles}>
          {bonds && (
            <BondsSection
              bonds={bonds}
              readOnly={readOnly}
              onClear={onClearBond}
              headingAs={headingAs}
              strings={strings}
            />
          )}
          {connections && (
            <ConnectionsSection
              connections={connections}
              readOnly={readOnly}
              moves={connectionMoves}
              showBonded={showBonded}
              defaultShowBonded={defaultShowBonded}
              onShowBondedChange={onShowBondedChange}
              onAdd={onAddConnection}
              onTicksChange={onConnectionTicksChange}
              onBondedChange={onConnectionBondedChange}
              onRankChange={onConnectionRankChange}
              onAction={onConnectionAction}
              onRoll={onRollConnection}
              headingAs={headingAs}
              rankLabels={rankLabels}
              strings={strings}
            />
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={deleting ? strings.deleteTitle(deleting.label) : undefined}
        description={
          deleting ? strings.deleteDescription(deleting.label) : undefined
        }
        confirmationText={
          deleting ? strings.remove(deleting.kind === "clock") : undefined
        }
        tone="danger"
        onConfirm={() => {
          if (deleting) onDelete?.(deleting.id);
          deletedRef.current = true;
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
        onClosed={() => {
          // Announced once the dialog has gone, as it makes the page's live
          // region inert while it is open.
          if (deletedRef.current && deleting) {
            announce(strings.deletedAnnouncement(deleting.label));
            setRefocus((count) => count + 1);
          }
          deletedRef.current = false;
          setDeleting(null);
        }}
      />
    </div>
  );
}
