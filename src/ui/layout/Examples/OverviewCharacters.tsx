import { ArrowSquareOutIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { HStack, Stack } from "ui/primitives";

import { css } from "styled-system/css";

import { Button } from "../../components/Button";
import { CopyButton } from "../../components/CopyButton";
import {
  sampleCharacters,
  samplePortraitSrc,
} from "../../docs/fixtures/characters";
import { CharacterCard } from "../../game/CharacterCard";
import { PlayerCard } from "../../game/PlayerCard";
import { SectionHeading } from "../SectionHeading";

/* ------------------------------------------------------------------------ */
/* Game overview                                                            */
/* ------------------------------------------------------------------------ */

/**
 * Cards in a column fill its width; where the column is wide enough (the
 * notes' width on a phone's tab, say) they sit two or more to a row.
 */
const cardGridStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
  gap: "3",
  alignItems: "start",
});

const [kira, orrin, senna] = sampleCharacters;

/** The game's characters, each ringed in its own theme where it has one. */
const overviewCharacters = [
  { ...kira, portraitUrl: samplePortraitSrc, colorScheme: "cinder" as const },
  { ...orrin, colorScheme: "myriad" as const },
  { ...senna, colorScheme: undefined },
];

/**
 * Characters, then (not in solo games) Players, as the live
 * `CharactersAndUsersTab`. Scott is the Guide here, so he sees Make Guide
 * and Kick Player on the others and Leave Guide Role and Leave Game on his
 * own card.
 */
export function OverviewCharacters(props: { solo?: boolean }) {
  const { solo } = props;
  const [onScreen, setOnScreen] = useState<string | null>(kira.id);
  return (
    <Stack gap="6">
      <Stack gap="3" as="section">
        <SectionHeading title="Characters" as="h3" />
        <div className={cardGridStyles}>
          {(solo ? overviewCharacters.slice(0, 1) : overviewCharacters).map(
            (character) => (
              <CharacterCard
                key={character.id}
                name={character.name}
                playerName={solo ? undefined : character.playerName}
                portraitUrl={character.portraitUrl}
                colorScheme={character.colorScheme}
                headingAs="h4"
                render={<a href={`#${character.id}`} />}
                actions={
                  <Button
                    size="sm"
                    variant="ghost"
                    startIcon={<ArrowSquareOutIcon />}
                    onClick={() =>
                      setOnScreen((current) =>
                        current === character.id ? null : character.id,
                      )
                    }
                  >
                    {onScreen === character.id ? "On Screen" : "Open on Screen"}
                  </Button>
                }
              />
            ),
          )}
        </div>
        <HStack>
          <Button
            variant="outline"
            startIcon={<PlusIcon />}
            render={<a href="#create-character" />}
            nativeButton={false}
          >
            Add Character
          </Button>
        </HStack>
      </Stack>
      {!solo && (
        <Stack gap="3" as="section">
          <SectionHeading title="Players" as="h3" />
          <div className={cardGridStyles}>
            <PlayerCard
              name={kira.playerName}
              role="guide"
              isYou
              headingAs="h4"
              status="online"
              statusLabel="Online"
              characters={[
                { id: kira.id, name: kira.name, colorScheme: "cinder" },
              ]}
              actions={
                <>
                  <Button size="sm" variant="ghost">
                    Leave Guide Role
                  </Button>
                  <Button size="sm" variant="ghost">
                    Leave Game
                  </Button>
                </>
              }
            />
            <PlayerCard
              name={orrin.playerName}
              role="player"
              headingAs="h4"
              status="online"
              statusLabel="Online"
              characters={[
                { id: orrin.id, name: orrin.name, colorScheme: "myriad" },
              ]}
              actions={
                <>
                  <Button size="sm" variant="ghost">
                    Make Guide
                  </Button>
                  <Button size="sm" variant="ghost">
                    Kick Player
                  </Button>
                </>
              }
            />
            <PlayerCard
              name={senna.playerName}
              role="player"
              headingAs="h4"
              status="away"
              statusLabel="Away"
              characters={[{ id: senna.id, name: senna.name }]}
              actions={
                <>
                  <Button size="sm" variant="ghost">
                    Make Guide
                  </Button>
                  <Button size="sm" variant="ghost">
                    Kick Player
                  </Button>
                </>
              }
            />
          </div>
          <HStack>
            <CopyButton
              variant="outline"
              text="https://iron-link.app/join/drowned-archive"
              label="Copy Invite Link"
              copiedLabel="Invite Link Copied"
            />
          </HStack>
        </Stack>
      )}
    </Stack>
  );
}
