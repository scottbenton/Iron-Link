import { Button as BaseButton } from "@base-ui/react/button";
import { CaretRight } from "@phosphor-icons/react";
import {
  ComponentPropsWithoutRef,
  ElementType,
  ReactElement,
  ReactNode,
} from "react";

import { Text } from "ui/components/Text";
import { VisuallyHidden } from "ui/components/VisuallyHidden";
import { formatSigned } from "ui/game/shared";
import type { SchemeName } from "ui/theme";

import { css, cx } from "styled-system/css";

import {
  CharacterPortrait,
  PortraitCrop,
  PortraitStatus,
} from "../CharacterPortrait/CharacterPortrait";
import { contentCardStyles } from "../MoveCard/cardStyles";

const cardStyles = css({
  display: "grid",
  gap: "3",
  padding: "3",
  paddingInlineEnd: "4",
  "&[data-pressable]": {
    boxShadow: "0 var(--border-widths-ledge) 0 token(colors.border.edge)",
    transform: "translateY(0)",
    transitionProperty: "transform, box-shadow, border-color, background-color",
    transitionDuration: "fast",
    transitionTimingFunction: "out",
  },
  "&[data-pressable]:has([data-card-link]:hover)": {
    borderColor: "border.control",
    background: "bg.muted",
    transform: "translateY(var(--spacing-lift))",
    boxShadow:
      "0 calc(var(--border-widths-ledge) - var(--spacing-lift)) 0 token(colors.border.edge)",
  },
  "&[data-pressable]:has([data-card-link]:is(:active, [data-pressed]))": {
    transform: "translateY(var(--spacing-sink))",
    boxShadow:
      "0 max(0px, calc(var(--border-widths-ledge) - var(--spacing-sink))) 0 token(colors.border.edge)",
    transitionDuration: "instant",
  },
  "&:has([data-card-link]:focus-visible)": {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "2px",
  },
});

const headStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  minWidth: 0,
  "& > [data-titles]": { flex: "1", minWidth: 0, display: "grid", gap: "0.5" },
  "& > [data-chevron]": { flex: "none", color: "fg.muted" },
});

/** The name; as a link or button it stretches over the whole card. */
const nameLinkStyles = css({
  color: "inherit",
  textDecoration: "none",
  font: "inherit",
  padding: 0,
  margin: 0,
  border: 0,
  background: "transparent",
  textAlign: "left",
  cursor: "pointer",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  _after: {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: "lg",
  },
});

const statsStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))",
  gap: "1.5",
  margin: 0,
  "& > div": {
    display: "grid",
    justifyItems: "center",
    gap: "0.5",
    paddingBlock: "1.5",
    paddingInline: "1",
    borderRadius: "md",
    background: "bg.muted",
    minWidth: 0,
  },
  "& dt": {
    order: 2,
    fontFamily: "heading",
    fontWeight: "bold",
    fontSize: "2xs",
    textTransform: "uppercase",
    letterSpacing: "label",
    color: "fg.muted",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  "& dd": {
    order: 1,
    margin: 0,
    fontFamily: "heading",
    fontWeight: "bold",
    fontSize: "lg",
    lineHeight: "none",
    fontVariantNumeric: "tabular-nums",
  },
  "& dd [data-max]": { color: "fg.subtle", fontSize: "xs" },
});

const actionsStyles = css({
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: "2",
  paddingBlockStart: "1",
});

export interface CharacterCardStat {
  label: string;
  value: number;
  /** For meters: shown small after the value, as "5/5". */
  max?: number;
}

export interface CharacterCardProps
  extends Omit<ComponentPropsWithoutRef<"article">, "children"> {
  name: string;
  /** The player, shown under the name. Leave out in solo games. */
  playerName?: string;
  /** A line in place of the player, such as "Ironsworn · Solo". */
  subtitle?: ReactNode;
  portraitUrl?: string;
  portraitCrop?: PortraitCrop;
  colorScheme?: SchemeName;
  colorSeed?: number;
  /** Rings the portrait, for the character whose sheet is open. */
  active?: boolean;
  status?: PortraitStatus;
  statusLabel?: string;
  /** Key stats or meters in a compact row: Edge, Heart, Health, Momentum. */
  stats?: CharacterCardStat[];
  /** What the stats row is called for screen readers. */
  statsLabel?: string;
  /**
   * Makes the card open the character: `render={<Link to={href} />}`. The
   * name becomes the link and stretches over the card.
   */
  render?: ReactElement;
  /** Makes the card a button that opens the character. */
  onOpen?: () => void;
  /** Buttons at the foot, such as Open on Screen. They stay pressable. */
  actions?: ReactNode;
  /** The element around the name, so headings nest. An h3 by default. */
  headingAs?: ElementType;
  className?: string;
}

/**
 * A character at a glance, as on a game's overview: portrait, name, player,
 * a few stats or meters and actions. With `render` or `onOpen` the whole
 * card opens the character, its actions still pressable.
 */
export function CharacterCard(props: CharacterCardProps) {
  const {
    name,
    playerName,
    subtitle,
    portraitUrl,
    portraitCrop,
    colorScheme,
    colorSeed,
    active,
    status,
    statusLabel,
    stats,
    statsLabel = "Stats",
    render,
    onOpen,
    actions,
    headingAs = "h3",
    className,
    ...rest
  } = props;

  const pressable = !!render || !!onOpen;
  const secondLine = subtitle ?? playerName;

  return (
    <article
      className={cx(contentCardStyles, cardStyles, className)}
      data-pressable={pressable || undefined}
      {...rest}
    >
      <div className={headStyles}>
        <CharacterPortrait
          name={name}
          portraitUrl={portraitUrl}
          crop={portraitCrop}
          colorScheme={colorScheme}
          colorSeed={colorSeed}
          active={active}
          status={status}
          statusLabel={statusLabel}
          size="lg"
          decorative
        />
        <div data-titles="">
          <Text as={headingAs} variant="h3" truncate>
            {pressable ? (
              <BaseButton
                data-card-link=""
                className={nameLinkStyles}
                render={render}
                nativeButton={!render}
                onClick={onOpen}
              >
                {name}
              </BaseButton>
            ) : (
              name
            )}
          </Text>
          {status && statusLabel && (
            <VisuallyHidden>{statusLabel}</VisuallyHidden>
          )}
          {secondLine && (
            <Text variant="bodySm" color="muted" truncate>
              {secondLine}
            </Text>
          )}
        </div>
        {pressable && <CaretRight data-chevron="" aria-hidden size={18} />}
      </div>

      {stats && stats.length > 0 && (
        <dl className={statsStyles} aria-label={statsLabel}>
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>
                {stat.value < 0 ? formatSigned(stat.value) : stat.value}
                {stat.max !== undefined && <span data-max="">/{stat.max}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {actions && <div className={actionsStyles}>{actions}</div>}
    </article>
  );
}
