import { PlusIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import { EmptyState } from "../../layout/EmptyState";
import { ProgressRank } from "../ProgressTrack";
import { ConnectionEntry } from "./ConnectionEntry";
import { TracksPanelSection } from "./TracksPanelSection";
import type { TracksPanelStrings } from "./tracksPanelStrings";
import type { ConnectionItem, TrackMove } from "./tracksPanelTypes";

export interface ConnectionsSectionProps {
  connections: ConnectionItem[];
  readOnly: boolean;
  moves: TrackMove[];
  showBonded?: boolean;
  defaultShowBonded?: boolean;
  onShowBondedChange?: (show: boolean) => void;
  onAdd?: () => void;
  onTicksChange?: (id: string, ticks: number) => void;
  onBondedChange?: (id: string, bonded: boolean) => void;
  onRankChange?: (id: string, rank: ProgressRank) => void;
  onAction?: (id: string, key: string) => void;
  onRoll?: (id: string, moveId: string) => void;
  headingAs: "h2" | "h3" | "h4";
  rankLabels?: Partial<Record<ProgressRank, string>>;
  strings: TracksPanelStrings;
}

/**
 * Starforged connections under the tracks: Show Bonded and Add, then each
 * connection's track with its roll (Forge a Bond) and Bonded box in view
 * and its sharing, removal and rank in its menu.
 */
export function ConnectionsSection(props: ConnectionsSectionProps) {
  const {
    connections,
    readOnly,
    moves,
    showBonded: showBondedProp,
    defaultShowBonded = false,
    onShowBondedChange,
    onAdd,
    headingAs,
    strings,
  } = props;
  const [ownShowBonded, setOwnShowBonded] = useState(defaultShowBonded);
  const showBonded = showBondedProp ?? ownShowBonded;
  const setShowBonded = (show: boolean) => {
    setOwnShowBonded(show);
    onShowBondedChange?.(show);
  };
  // Show Bonded in the empty state goes once pressed; its checkbox, which
  // now reads checked, takes focus.
  const showBondedRef = useRef<HTMLElement>(null);
  const [refocus, setRefocus] = useState(0);
  useEffect(() => {
    if (refocus) showBondedRef.current?.focus();
  }, [refocus]);
  const shown = connections.filter(
    (connection) => showBonded || !connection.bonded,
  );

  return (
    <TracksPanelSection
      title={strings.connections}
      headingAs={headingAs}
      count={shown.length}
      controls={
        <>
          <Checkbox
            ref={showBondedRef}
            label={strings.showBonded}
            size="sm"
            checked={showBonded}
            onCheckedChange={setShowBonded}
          />
          {!readOnly && onAdd && (
            <Button
              size="sm"
              variant="outline"
              startIcon={<PlusIcon />}
              aria-label={strings.addConnection}
              onClick={onAdd}
            >
              {strings.addConnectionShort}
            </Button>
          )}
        </>
      }
    >
      {shown.length === 0 ? (
        <EmptyState
          size="sm"
          title={
            connections.length === 0 ? strings.noConnections : strings.allBonded
          }
          message={
            connections.length === 0
              ? readOnly || !onAdd
                ? undefined
                : strings.noConnectionsMessage
              : strings.allBondedMessage(connections.length)
          }
          action={
            connections.length > 0 && (
              <Button
                size="sm"
                onClick={() => {
                  setShowBonded(true);
                  setRefocus((count) => count + 1);
                }}
              >
                {strings.showBonded}
              </Button>
            )
          }
        />
      ) : (
        shown.map((connection) => (
          <ConnectionEntry
            key={connection.id}
            {...props}
            connection={connection}
            moves={moves}
          />
        ))
      )}
    </TracksPanelSection>
  );
}
