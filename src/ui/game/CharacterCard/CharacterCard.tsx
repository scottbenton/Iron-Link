import { CaretRight } from "@phosphor-icons/react";
import {
  ComponentPropsWithoutRef,
  ElementType,
  ReactElement,
  ReactNode,
} from "react";

import { Card, CardLinkOverlay } from "ui/components/Card";
import { Text } from "ui/components/Text";
import { VisuallyHidden } from "ui/components/VisuallyHidden";
import { formatSigned } from "ui/game/shared";
import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";
import type { SchemeName } from "ui/theme";

import { css, cx } from "styled-system/css";

import {
  CharacterPortrait,
  PortraitCrop,
  PortraitStatus,
} from "../CharacterPortrait/CharacterPortrait";

const cardStyles = css({ paddingInlineEnd: "4" });

const headStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  minWidth: 0,
  "& > [data-titles]": { flex: "1", minWidth: 0, display: "grid", gap: "0.5" },
  "& > [data-chevron]": { flex: "none", color: "fg.muted" },
});

/** The name as a button: the overlay's look, without a button's own. */
const nameButtonStyles = css({
  padding: 0,
  margin: 0,
  border: 0,
  background: "transparent",
  textAlign: "left",
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
  extends LayoutProps,
    Omit<ComponentPropsWithoutRef<"article">, "children"> {
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
  } = withLayoutProps(props);

  const pressable = !!render || !!onOpen;
  const secondLine = subtitle ?? playerName;

  return (
    <Card
      render={<article />}
      padding="sm"
      className={cx(cardStyles, className)}
      {...(rest as ComponentPropsWithoutRef<"div">)}
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
              <CardLinkOverlay
                render={
                  render ?? (
                    <button
                      type="button"
                      className={nameButtonStyles}
                      onClick={onOpen}
                    />
                  )
                }
              >
                {name}
              </CardLinkOverlay>
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
    </Card>
  );
}
