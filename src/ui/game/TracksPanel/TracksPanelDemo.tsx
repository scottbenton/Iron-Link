/**
 * The Tracks tab wired up for stories: marking, rolling a clock's progress
 * (a real d100 against its odds), completing, deleting, the second screen
 * and connections all keep their state, and Add Track and Edit open
 * TrackDialog. Story-only: the TracksPanel stories and the game page
 * examples use it; nothing in the app imports it.
 */
import { useState } from "react";

import { MAX_TICKS } from "../ProgressTrack";
import { TrackDialog, TrackDialogValues } from "./TrackDialog";
import { TracksPanel, TracksPanelProps } from "./TracksPanel";
import {
  sampleConnections,
  sampleTracks,
  starforgedCompletionMoves,
  starforgedConnectionMoves,
} from "./tracksPanelSamples";
import type {
  BondItem,
  ConnectionItem,
  OracleOdds,
  TrackItem,
  TrackKind,
} from "./tracksPanelTypes";

/** The chance of a Yes for each odds, as Ask the Oracle has it. */
const yesAtOrBelow: Record<OracleOdds, number> = {
  almostCertain: 90,
  likely: 75,
  fiftyFifty: 50,
  unlikely: 25,
  smallChance: 10,
};

interface DialogState {
  open: boolean;
  kind: TrackKind;
  /** The track being edited; none when adding. */
  track?: TrackItem;
  /** Bumped on each open, so the form starts fresh. */
  key: number;
}

export interface TracksPanelDemoProps
  extends Partial<Omit<TracksPanelProps, "tracks" | "connections" | "bonds">> {
  initialTracks?: TrackItem[];
  /** Null leaves the Connections section out. */
  initialConnections?: ConnectionItem[] | null;
  initialBonds?: BondItem[];
}

export function TracksPanelDemo(props: TracksPanelDemoProps) {
  const {
    initialTracks = sampleTracks,
    initialConnections = sampleConnections,
    initialBonds,
    readOnly,
    ...rest
  } = props;
  const [tracks, setTracks] = useState(initialTracks);
  const [connections, setConnections] = useState(initialConnections);
  const [bonds, setBonds] = useState(initialBonds);
  const [secondScreen, setSecondScreen] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    kind: "vow",
    key: 0,
  });

  const update = (id: string, change: (track: TrackItem) => TrackItem) =>
    setTracks((current) =>
      current.map((track) => (track.id === id ? change(track) : track)),
    );
  const updateConnection = (id: string, change: Partial<ConnectionItem>) =>
    setConnections(
      (current) =>
        current?.map((connection) =>
          connection.id === id ? { ...connection, ...change } : connection,
        ) ?? null,
    );

  const save = (values: TrackDialogValues) => {
    const { track, kind } = dialog;
    if (track) {
      update(track.id, (current) =>
        current.kind === "clock"
          ? {
              ...current,
              label: values.label,
              description: values.description,
              segments: values.segments ?? current.segments,
              value: Math.min(current.value, values.segments ?? 99),
            }
          : {
              ...current,
              label: values.label,
              description: values.description,
              rank: values.rank ?? current.rank,
              ticks: values.resetProgress ? 0 : current.ticks,
            },
      );
    } else {
      const id = `track-${Date.now()}`;
      const added: TrackItem =
        kind === "clock"
          ? {
              id,
              kind,
              label: values.label,
              description: values.description,
              segments: values.segments ?? 6,
              value: 0,
              odds: "likely",
            }
          : {
              id,
              kind,
              label: values.label,
              description: values.description,
              rank: values.rank ?? "dangerous",
              ticks: 0,
              tension: kind === "sceneChallenge" ? 0 : undefined,
            };
      setTracks((current) => [added, ...current]);
    }
    setDialog((current) => ({ ...current, open: false }));
  };

  return (
    <>
      <TracksPanel
        tracks={tracks}
        readOnly={readOnly}
        connections={connections ?? undefined}
        bonds={bonds}
        completionMoves={starforgedCompletionMoves}
        connectionMoves={starforgedConnectionMoves}
        secondScreenTrackId={secondScreen}
        onAdd={(kind) =>
          setDialog((current) => ({
            open: true,
            kind,
            key: current.key + 1,
          }))
        }
        onEdit={(id) => {
          const track = tracks.find((item) => item.id === id);
          if (track) {
            setDialog((current) => ({
              open: true,
              kind: track.kind,
              track,
              key: current.key + 1,
            }));
          }
        }}
        onTicksChange={(id, ticks) =>
          update(id, (track) => ({ ...track, ticks }))
        }
        onClockChange={(id, value) =>
          update(id, (track) =>
            track.kind === "clock"
              ? { ...track, value }
              : { ...track, tension: value },
          )
        }
        onRollMove={() => {}}
        onRollClock={(id) =>
          update(id, (track) => {
            if (track.kind !== "clock") return track;
            const roll = Math.floor(Math.random() * 100) + 1;
            const yes = roll <= yesAtOrBelow[track.odds ?? "likely"];
            const match = roll % 11 === 0 || roll === 100;
            if (!yes) return track;
            return {
              ...track,
              value: Math.min(track.value + (match ? 2 : 1), track.segments),
            };
          })
        }
        onOddsChange={(id, odds) => update(id, (track) => ({ ...track, odds }))}
        onCompletedChange={(id, completed) =>
          update(id, (track) => ({ ...track, completed }))
        }
        onDelete={(id) =>
          setTracks((current) => current.filter((track) => track.id !== id))
        }
        onSecondScreenChange={(id, open) => setSecondScreen(open ? id : null)}
        onAddConnection={() => {}}
        onConnectionTicksChange={(id, ticks) =>
          updateConnection(id, {
            ticks: Math.min(Math.max(ticks, 0), MAX_TICKS),
          })
        }
        onConnectionBondedChange={(id, bonded) =>
          updateConnection(id, { bonded })
        }
        onConnectionRankChange={(id, rank) => updateConnection(id, { rank })}
        onConnectionAction={(id, key) => {
          if (key === "remove") {
            setConnections(
              (current) =>
                current?.filter((connection) => connection.id !== id) ?? null,
            );
          } else if (key === "share") {
            updateConnection(id, { description: "Shared with the party" });
          } else if (key.startsWith("keep:")) {
            updateConnection(id, { description: undefined });
          }
        }}
        onRollConnection={() => {}}
        onClearBond={(id) =>
          setBonds((current) => current?.filter((bond) => bond.id !== id))
        }
        {...rest}
      />
      <TrackDialog
        key={dialog.key}
        open={dialog.open}
        onClose={() => setDialog((current) => ({ ...current, open: false }))}
        kind={dialog.kind}
        track={dialog.track}
        onSave={save}
      />
    </>
  );
}
