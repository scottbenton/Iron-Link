import { DotsThreeIcon, PlusIcon } from "@phosphor-icons/react";
import { ElementType, useEffect, useRef, useState } from "react";

import { css } from "styled-system/css";

import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import { IconButton } from "../../components/IconButton";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "../../components/Menu";
import { EmptyState } from "../../layout/EmptyState";
import {
  ProgressRank,
  ProgressTrack,
  defaultRankLabels,
} from "../ProgressTrack";
import { RollButton } from "../RollButton";
import { TracksPanelSection } from "./TracksPanelSection";
import type { TracksPanelStrings } from "./tracksPanelStrings";
import type { ConnectionItem, TrackMove } from "./tracksPanelTypes";

const ranks: ProgressRank[] = [
  "troublesome",
  "dangerous",
  "formidable",
  "extreme",
  "epic",
];

const bondedNoteStyles = css({
  fontSize: "sm",
  color: "fg.muted",
});

const actionsEndStyles = css({ marginInlineStart: "auto" });

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

function ConnectionEntry(
  props: ConnectionsSectionProps & {
    connection: ConnectionItem;
    titleAs?: ElementType;
  },
) {
  const {
    connection,
    readOnly,
    moves,
    onTicksChange,
    onBondedChange,
    onRankChange,
    onAction,
    onRoll,
    rankLabels: rankLabelsProp,
    strings,
  } = props;
  const rankLabels = { ...defaultRankLabels, ...rankLabelsProp };
  const editable = !readOnly && connection.editable !== false;
  const menuActions = connection.menuActions ?? [];
  const label = connection.label;

  const roll =
    editable &&
    onRoll &&
    (moves.length === 1 ? (
      <RollButton
        size="sm"
        aria-label={strings.rollMoveLabel(moves[0].name, label)}
        onClick={() => onRoll(connection.id, moves[0].id)}
      >
        {moves[0].name}
      </RollButton>
    ) : moves.length > 1 ? (
      <Menu>
        <MenuTrigger
          render={
            <RollButton
              size="sm"
              aria-label={strings.rollConnectionLabel(label)}
            >
              {strings.rollConnection}
            </RollButton>
          }
        />
        <MenuContent>
          {moves.map((move) => (
            <MenuItem
              key={move.id}
              onClick={() => onRoll(connection.id, move.id)}
            >
              {move.name}
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>
    ) : null);

  const menu = editable && (menuActions.length > 0 || onRankChange) && (
    <Menu>
      <MenuTrigger
        render={
          <IconButton label={strings.connectionOptionsLabel(label)} size="sm">
            <DotsThreeIcon weight="bold" />
          </IconButton>
        }
      />
      <MenuContent align="end">
        {menuActions.map((action) => (
          <MenuItem
            key={action.key}
            description={action.description}
            disabled={action.disabled}
            tone={action.tone}
            onClick={() => onAction?.(connection.id, action.key)}
          >
            {action.label}
          </MenuItem>
        ))}
        {menuActions.length > 0 && onRankChange && <MenuSeparator />}
        {onRankChange && (
          <MenuRadioGroup
            label={strings.rank}
            value={connection.rank}
            onValueChange={(rank) =>
              onRankChange(connection.id, rank as ProgressRank)
            }
          >
            {ranks.map((rank) => (
              <MenuRadioItem key={rank} value={rank}>
                {rankLabels[rank]}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        )}
      </MenuContent>
    </Menu>
  );

  const bonded =
    editable && onBondedChange ? (
      <Checkbox
        label={strings.bonded}
        size="sm"
        checked={connection.bonded}
        onCheckedChange={(checked) => onBondedChange(connection.id, checked)}
        className={actionsEndStyles}
      />
    ) : (
      connection.bonded && (
        <span className={bondedNoteStyles}>{strings.bonded}</span>
      )
    );

  return (
    <ProgressTrack
      label={label}
      typeLabel={strings.connectionType}
      rank={connection.rank}
      ticks={connection.ticks}
      description={connection.description}
      titleHref={connection.href}
      onChange={
        editable && onTicksChange
          ? (ticks) => onTicksChange(connection.id, ticks)
          : undefined
      }
      headerAction={menu || undefined}
      rankLabels={rankLabelsProp}
      actions={
        (roll || bonded) && (
          <>
            {roll}
            {bonded}
          </>
        )
      }
    />
  );
}
