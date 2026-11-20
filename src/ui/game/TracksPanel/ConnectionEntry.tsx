import { DotsThreeIcon } from "@phosphor-icons/react";
import { ElementType } from "react";

import { css } from "styled-system/css";

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
import {
  ProgressRank,
  ProgressTrack,
  defaultRankLabels,
} from "../ProgressTrack";
import { RollButton } from "../RollButton";
import type { ConnectionsSectionProps } from "./ConnectionsSection";
import type { ConnectionItem } from "./tracksPanelTypes";

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

export function ConnectionEntry(
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
