import { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { Text } from "ui/components/Text";
import { VisuallyHidden } from "ui/components/VisuallyHidden";

import { css, cva, cx } from "styled-system/css";

import {
  CharacterPortrait,
  PortraitStatus,
} from "../CharacterPortrait/CharacterPortrait";
import { contentCardStyles } from "../MoveCard/cardStyles";
import {
  PortraitGroup,
  PortraitGroupMember,
} from "../PortraitGroup/PortraitGroup";

export type PlayerRole = "guide" | "player" | "viewer";

const cardStyles = css({
  display: "grid",
  gap: "3",
  padding: "3",
  paddingInlineEnd: "4",
});

const headStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  minWidth: 0,
  "& > [data-titles]": {
    flex: "1",
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
    fontWeight: "semibold",
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

const footStyles = css({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "2",
  "& > [data-actions]": {
    display: "flex",
    flexWrap: "wrap",
    gap: "2",
    marginInlineStart: "auto",
  },
});

export interface PlayerCardProps
  extends Omit<ComponentPropsWithoutRef<"article">, "children"> {
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
  /** Their characters, as a small portrait row. */
  characters?: PortraitGroupMember[];
  charactersLabel?: string;
  /** Buttons such as Make Guide, Leave Game or Remove Player. */
  actions?: ReactNode;
  /** The element around the name, so headings nest. An h3 by default. */
  headingAs?: ElementType;
  className?: string;
}

/**
 * A person in a game: their name, a role chip (Guide, Player, Viewer),
 * their characters and actions for managing them.
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
  } = props;

  const hasFoot = (characters && characters.length > 0) || actions;

  return (
    <article className={cx(contentCardStyles, cardStyles, className)} {...rest}>
      <div className={headStyles}>
        <CharacterPortrait
          name={name}
          portraitUrl={avatarUrl}
          status={status}
          statusLabel={statusLabel}
          size="md"
          decorative
        />
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
      </div>
      {hasFoot && (
        <div className={footStyles}>
          {characters && characters.length > 0 && (
            <PortraitGroup
              members={characters}
              size="sm"
              max={4}
              label={charactersLabel}
            />
          )}
          {actions && <div data-actions="">{actions}</div>}
        </div>
      )}
    </article>
  );
}
