import { Menu as BaseMenu } from "@base-ui/react/menu";
import {
  CaretDownIcon,
  CheckIcon,
  PlusIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { ReactNode } from "react";

import { focusRing } from "ui/styles/focus";
import { quietPressable } from "ui/styles/pressable";

import { css, cx } from "styled-system/css";

import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuLinkItem,
  MenuSeparator,
} from "../../components/Menu";
import {
  LayoutLinkComponent,
  useLinkComponent,
} from "../../layout/shared/linkContext";
import { LayoutProps, withLayoutProps } from "../../styles/layoutProps";

const triggerStyles = css({
  ...quietPressable,
  display: "flex",
  alignItems: "center",
  gap: "2",
  minWidth: 0,
  maxWidth: "100%",
  minHeight: "touch",
  paddingInline: "1.5",
  borderRadius: "md",
  color: "inherit",
  font: "inherit",
  textAlign: "start",
  "&[data-popup-open]": { background: "overlay.pressed" },
  // Inside the bar's h1, which clips: the ring stays inside the button.
  _focusVisible: focusRing.inset,
  "& [data-part=portrait]": { display: "flex", flex: "none" },
  "& [data-part=name]": {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  "& [data-part=caret]": {
    flex: "none",
    width: "16px",
    height: "16px",
    color: "fg.muted",
    transition: "rotate token(durations.fast) token(easings.out)",
    _reducedMotion: { transition: "none" },
  },
  "&[data-popup-open] [data-part=caret]": { rotate: "180deg" },
});

const contentStyles = css({ width: "280px" });

const checkStyles = css({ color: "accent.fg", display: "flex" });

/** A 24px leading slot, so portraits and icons line up. */
const leadStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "2.5",
  minWidth: 0,
  "& > [data-part=lead]": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "none",
    width: "24px",
    height: "24px",
    color: "fg.muted",
  },
  "& > [data-part=lead] > svg": { width: "icon.md", height: "icon.md" },
  "& > [data-part=text]": {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

function Lead(props: { lead?: ReactNode; children: ReactNode }) {
  return (
    <span className={leadStyles}>
      <span data-part="lead" aria-hidden>
        {props.lead}
      </span>
      <span data-part="text">{props.children}</span>
    </span>
  );
}

export interface CharacterSwitcherCharacter {
  id: string;
  name: string;
  href: string;
  /** A 24px portrait (CharacterPortrait size `xs`), decorative. */
  portrait?: ReactNode;
}

export interface CharacterSwitcherProps extends LayoutProps {
  /** The game's characters, in the game's order. */
  characters: CharacterSwitcherCharacter[];
  /**
   * The page showing: a character's id, `overview` for the game's overview,
   * or `add` for Add Character.
   */
  current: string;
  /** The button's text when no character is open, such as the game's name. */
  gameName: string;
  overviewHref: string;
  /** Left out for people who can't add characters. */
  addCharacterHref?: string;
  charactersLabel?: string;
  addCharacterLabel?: string;
  overviewLabel?: string;
  linkComponent?: LayoutLinkComponent;
  className?: string;
}

/**
 * The phone top bar's title: the open character's portrait and name as a
 * button that opens a menu of the game's characters, Add Character and the
 * game's overview. Wider screens have the game's page tabs instead. Put it
 * in NavBar's `title`, so the button's text is the page's h1.
 */
export function CharacterSwitcher(props: CharacterSwitcherProps) {
  const {
    characters,
    current,
    gameName,
    overviewHref,
    addCharacterHref,
    charactersLabel = "Characters",
    addCharacterLabel = "Add Character",
    overviewLabel = "Game overview",
    linkComponent,
    className,
  } = withLayoutProps(props);
  const Link = useLinkComponent(linkComponent);
  const character = characters.find((item) => item.id === current);
  const check = (
    <span className={checkStyles}>
      <CheckIcon weight="bold" aria-hidden />
    </span>
  );

  return (
    <Menu>
      <BaseMenu.Trigger className={cx(triggerStyles, className)}>
        {character?.portrait && (
          <span data-part="portrait" aria-hidden>
            {character.portrait}
          </span>
        )}
        <span data-part="name">{character?.name ?? gameName}</span>
        <CaretDownIcon data-part="caret" weight="bold" aria-hidden />
      </BaseMenu.Trigger>
      <MenuContent className={contentStyles}>
        <MenuGroup label={charactersLabel}>
          {characters.map((item) => (
            <MenuLinkItem
              key={item.id}
              label={item.name}
              render={<Link href={item.href} />}
              aria-current={item.id === current ? "page" : undefined}
              shortcut={item.id === current ? check : undefined}
            >
              <Lead lead={item.portrait}>{item.name}</Lead>
            </MenuLinkItem>
          ))}
          {addCharacterHref && (
            <MenuLinkItem
              label={addCharacterLabel}
              render={<Link href={addCharacterHref} />}
              aria-current={current === "add" ? "page" : undefined}
              shortcut={current === "add" ? check : undefined}
            >
              <Lead lead={<PlusIcon />}>{addCharacterLabel}</Lead>
            </MenuLinkItem>
          )}
        </MenuGroup>
        <MenuSeparator />
        <MenuLinkItem
          icon={<UsersThreeIcon />}
          render={<Link href={overviewHref} />}
          aria-current={current === "overview" ? "page" : undefined}
          shortcut={current === "overview" ? check : undefined}
        >
          {overviewLabel}
        </MenuLinkItem>
      </MenuContent>
    </Menu>
  );
}
