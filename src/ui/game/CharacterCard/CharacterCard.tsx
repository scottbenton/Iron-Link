import { CaretRight } from "@phosphor-icons/react";
import {
  ComponentPropsWithoutRef,
  ElementType,
  ReactElement,
  ReactNode,
} from "react";

import { Card, CardLinkOverlay } from "ui/components/Card";
import { Text } from "ui/components/Text";
import { CssProp, withCssProp } from "ui/styles/cssProp";
import type { SchemeName } from "ui/theme";

import { css, cx } from "styled-system/css";

import {
  CharacterPortrait,
  PortraitCrop,
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

const actionsStyles = css({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: "2",
  paddingBlockStart: "1",
});

export interface CharacterCardProps
  extends CssProp,
    Omit<ComponentPropsWithoutRef<"article">, "children"> {
  name: string;
  /** The player, shown under the name. Leave out in solo games. */
  playerName?: string;
  portraitUrl?: string;
  portraitCrop?: PortraitCrop;
  colorScheme?: SchemeName;
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
 * A character on a game's Characters tab: portrait, name, player (left out
 * in solo games) and actions such as Open on Screen. With `render` or `onOpen` the whole
 * card opens the character, its actions still pressable.
 */
export function CharacterCard(props: CharacterCardProps) {
  const {
    name,
    playerName,
    portraitUrl,
    portraitCrop,
    colorScheme,
    render,
    onOpen,
    actions,
    headingAs = "h3",
    className,
    ...rest
  } = withCssProp(props);

  const pressable = !!render || !!onOpen;

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
          {playerName && (
            <Text variant="bodySm" color="muted" truncate>
              {playerName}
            </Text>
          )}
        </div>
        {pressable && <CaretRight data-chevron="" aria-hidden size={18} />}
      </div>

      {actions && <div className={actionsStyles}>{actions}</div>}
    </Card>
  );
}
