import { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { Text } from "ui/components/Text";
import { VisuallyHidden } from "ui/components/VisuallyHidden";
import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cva, cx } from "styled-system/css";

import {
  CharacterPortrait,
  PortraitStatus,
} from "../CharacterPortrait/CharacterPortrait";
import { contentCardStyles } from "../MoveCard/cardStyles";
import { PortraitGroupMember } from "../PortraitGroup/PortraitGroup";

export type PlayerRole = "guide" | "player" | "viewer";

// One row: portrait, then the name over the role chip, then the actions. A
// narrow card puts the actions under the text instead. The player's
// characters, named, run along the foot of the card under a hairline.
const cardStyles = css({
  containerType: "inline-size",
  containerName: "player-card",
  padding: "3",
  "& > [data-player-layout]": {
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr) auto",
    gridTemplateAreas: '"portrait titles actions"',
    alignItems: "center",
    columnGap: "3",
    rowGap: "2",
  },
  "& [data-player-portrait]": { gridArea: "portrait", alignSelf: "start" },
  "& [data-titles]": {
    gridArea: "titles",
    minWidth: 0,
    display: "grid",
    gap: "1",
    justifyItems: "start",
  },
  "& [data-name-line]": {
    display: "flex",
    alignItems: "baseline",
    gap: "2",
    minWidth: 0,
    maxWidth: "100%",
  },
  // The hairline runs the card's full width, like a card footer.
  "& [data-characters]": {
    display: "flex",
    flexWrap: "wrap",
    columnGap: "4",
    rowGap: "2",
    marginBlock: 0,
    marginBlockStart: "3",
    marginInline: "-3",
    paddingInline: "3",
    paddingBlockStart: "3",
    paddingBlockEnd: 0,
    listStyle: "none",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border.subtle",
  },
  "& [data-characters] > li": {
    display: "inline-flex",
    alignItems: "center",
    gap: "1.5",
    minWidth: 0,
    maxWidth: "100%",
  },
  "& [data-actions]": {
    gridArea: "actions",
    display: "flex",
    flexWrap: "wrap",
    gap: "2",
    justifyContent: "flex-end",
  },
  "@container player-card (max-width: 339.98px)": {
    "& > [data-player-layout]": {
      gridTemplateColumns: "auto minmax(0, 1fr)",
      // The actions take the card's whole width under the portrait, so two
      // of them (Make Guide, Kick Player) still fit on one line.
      gridTemplateAreas: '"portrait titles" "actions actions"',
    },
    "& [data-actions]": { justifyContent: "flex-end" },
  },
});

export const roleChipStyles = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1",
    height: "22px",
    paddingInline: "2",
    borderRadius: "full",
    borderWidth: "1px",
    borderStyle: "solid",
    fontFamily: "heading",
    fontWeight: "bold",
    fontSize: "xs",
    lineHeight: "none",
    letterSpacing: "label",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  variants: {
    role: {
      guide: {
        background: "accent.soft",
        color: "accent.fg",
        borderColor:
          "color-mix(in oklab, token(colors.accent.fg) 28%, transparent)",
      },
      player: {
        background: "bg.muted",
        color: "fg.default",
        borderColor: "border.default",
      },
      viewer: {
        background: "transparent",
        color: "fg.muted",
        borderColor: "border.default",
        borderStyle: "dashed",
      },
    },
  },
  defaultVariants: { role: "player" },
});

const youStyles = css({
  flex: "none",
  fontSize: "xs",
  color: "fg.subtle",
  fontWeight: "medium",
});

export interface PlayerCardProps
  extends LayoutProps,
    Omit<ComponentPropsWithoutRef<"article">, "children"> {
  /** The player's display name. */
  name: string;
  /** Their role in the game. Leave out in games without roles (solo, co-op). */
  role?: PlayerRole;
  /** Words for each role. */
  roleLabels?: Record<PlayerRole, string>;
  /** Marks the signed-in person's own card. */
  isYou?: boolean;
  youLabel?: string;
  /** An avatar image for the player. */
  avatarUrl?: string;
  status?: PortraitStatus;
  statusLabel?: string;
  /**
   * Their characters, each a small portrait (in its colour scheme) and its
   * name, along the foot of the card.
   */
  characters?: PortraitGroupMember[];
  /** The character list's name for screen readers. */
  charactersLabel?: string;
  /** Buttons such as Make Guide, Leave Game or Remove Player. */
  actions?: ReactNode;
  /** The element around the name, so headings nest. An h3 by default. */
  headingAs?: ElementType;
  className?: string;
}

/**
 * A person in a game: their name, a role chip (Guide, Player, Viewer) and
 * actions for managing them, with their characters named along the foot of
 * the card.
 */
export function PlayerCard(props: PlayerCardProps) {
  const {
    name,
    role,
    roleLabels = { guide: "Guide", player: "Player", viewer: "Viewer" },
    isYou,
    youLabel = "(you)",
    avatarUrl,
    status,
    statusLabel,
    characters,
    charactersLabel = `${name}'s characters`,
    actions,
    headingAs = "h3",
    className,
    ...rest
  } = withLayoutProps(props);

  const hasCharacters = characters && characters.length > 0;

  return (
    <article className={cx(contentCardStyles, cardStyles, className)} {...rest}>
      <div data-player-layout="">
        <span data-player-portrait="">
          <CharacterPortrait
            name={name}
            portraitUrl={avatarUrl}
            status={status}
            statusLabel={statusLabel}
            size="md"
            decorative
          />
        </span>
        <div data-titles="">
          <div data-name-line="">
            <Text as={headingAs} variant="h4" truncate>
              {name}
            </Text>
            {isYou && <span className={youStyles}>{youLabel}</span>}
            {status && statusLabel && (
              <VisuallyHidden>{statusLabel}</VisuallyHidden>
            )}
          </div>
          {role && (
            <span className={roleChipStyles({ role })}>{roleLabels[role]}</span>
          )}
        </div>
        {actions && <div data-actions="">{actions}</div>}
      </div>
      {hasCharacters && (
        <ul data-characters="" aria-label={charactersLabel}>
          {characters.map(({ id, ...character }) => (
            <li key={id}>
              <CharacterPortrait {...character} size="xs" decorative />
              <Text as="span" variant="bodySm" truncate>
                {character.name}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
