import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";

import { ErrorBoundary } from "components/ErrorBoundary";

import { VisuallyHidden } from "ui/components/VisuallyHidden";
import { BookOpenIcon, FileTextIcon, UserIcon, UsersThreeIcon } from "ui/icons";
import { MobileNav, MobileNavItem } from "ui/layout";
import { Box, Flex } from "ui/primitives";

import { NotesSection } from "pages/games/characterSheet/components/NotesSection";
import { ReferenceSidebarContents } from "pages/games/characterSheet/components/ReferenceSidebarContents";

type PhoneSection = "page" | "notes" | "reference";

export interface PhoneGamePageProps {
  /** A character's page, rather than the game's overview. */
  onCharacter: boolean;
  /** Where the character or overview page is: moving to another resets. */
  pageKey: string;
  banner?: ReactNode;
}

/**
 * The game page on phones: one section at a time, the page (a character or
 * the game's overview), the notes or the reference, chosen from the bottom
 * bar. Every section stays mounted, so an open note or a scrolled list keeps
 * its place.
 */
export function PhoneGamePage(props: PhoneGamePageProps) {
  const { onCharacter, pageKey, banner } = props;
  const { t } = useTranslation();
  const [section, setSection] = useState<PhoneSection>("page");

  // Another character, or the overview, opens on its own page.
  useEffect(() => {
    setSection("page");
  }, [pageKey]);

  const pageTitle = onCharacter
    ? t("character.character-sidebar.header", "Character")
    : t("game.overview-sidebar.header", "Game Overview");

  const sections: {
    id: PhoneSection;
    label: string;
    title: string;
    icon: ReactNode;
    currentIcon: ReactNode;
    content: ReactNode;
  }[] = [
    {
      id: "page",
      label: onCharacter
        ? t("game.character", "Character")
        : t("game.overview", "Overview"),
      title: pageTitle,
      icon: onCharacter ? <UserIcon /> : <UsersThreeIcon />,
      currentIcon: onCharacter ? (
        <UserIcon weight="fill" />
      ) : (
        <UsersThreeIcon weight="fill" />
      ),
      content: <Outlet />,
    },
    {
      id: "notes",
      label: t("game.notes", "Notes"),
      title: t("game.notes", "Notes"),
      icon: <FileTextIcon />,
      currentIcon: <FileTextIcon weight="fill" />,
      content: <NotesSection />,
    },
    {
      id: "reference",
      label: t("game.reference", "Reference"),
      title: t("game.reference", "Reference"),
      icon: <BookOpenIcon />,
      currentIcon: <BookOpenIcon weight="fill" />,
      content: <ReferenceSidebarContents />,
    },
  ];

  const items: MobileNavItem[] = sections.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    currentIcon: item.currentIcon,
    current: item.id === section,
    onSelect: () => setSection(item.id),
  }));

  return (
    <Flex direction="column" flex="1 1 auto" minHeight="0">
      {banner}
      {sections.map((item) => (
        <Box
          as="section"
          key={item.id}
          aria-labelledby={`game-phone-${item.id}-heading`}
          hidden={item.id !== section}
          display="flex"
          flexDirection="column"
          flex="1 1 auto"
          minHeight="0"
          overflowY="auto"
          css={{ "&[hidden]": { display: "none" } }}
        >
          <VisuallyHidden>
            <h2 id={`game-phone-${item.id}-heading`}>{item.title}</h2>
          </VisuallyHidden>
          <ErrorBoundary>{item.content}</ErrorBoundary>
        </Box>
      ))}
      <MobileNav
        css={{ flex: "none" }}
        label={t("game.sections", "Game Sections")}
        items={items}
      />
    </Flex>
  );
}
