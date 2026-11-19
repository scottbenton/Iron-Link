import { GlobeHemisphereWest, MapTrifold, Users } from "@phosphor-icons/react";
import { FormEvent, ReactNode, useId, useMemo, useState } from "react";

import { Alert } from "ui/components/Alert";
import { Button } from "ui/components/Button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogHeader,
} from "ui/components/Dialog";
import { Text } from "ui/components/Text";
import { schemes } from "ui/theme";

import { css } from "styled-system/css";

import { CharacterPortrait, PortraitCrop } from "../CharacterPortrait";
import { ThemeRow } from "./ThemeRow";
import {
  ThemeChoice,
  ThemeLevels,
  charactersHaveThemes,
  getAutomaticScheme,
  resolveTheme,
} from "./resolveTheme";
import {
  ThemeDialogStrings,
  defaultThemeDialogStrings,
} from "./themeDialogStrings";

/** A character the person can edit, in this game. */
export interface ThemeDialogCharacter {
  id: string;
  name: string;
  portraitUrl?: string;
  crop?: PortraitCrop;
  /** The character's own theme, or null to use the game's. */
  theme: ThemeChoice;
  /** The owner's name, for a character someone else shared to edit. */
  sharedBy?: string;
}

export interface ThemeDialogGame {
  name: string;
  /** The game's own theme, or null to use each person's app theme. */
  theme: ThemeChoice;
  /** False for a player who isn't a Guide: the row shows, read only. */
  canEdit: boolean;
  /** Why it is read only. "Only the game's Guides can change its theme." */
  readOnlyReason?: string;
  /**
   * A solo game. With one character the game holds the theme and no
   * character row shows; from a second character on, the rows return.
   */
  solo?: boolean;
}

/** Something a theme is set on. */
export type ThemeTarget =
  | { kind: "character"; id: string }
  | { kind: "game" }
  | { kind: "app" };

/** One changed theme, from Save. */
export interface ThemeChange {
  target: ThemeTarget;
  /** The new theme, or null to fall back to the next level. */
  theme: ThemeChoice;
}

export interface ThemeDialogProps {
  open: boolean;
  onClose: () => void;
  /**
   * Every character in the game the person can edit, whichever is open. The
   * dialog lists their own first, then shared ones, in the given order. In
   * a solo game with one character they have no rows (see `game.solo`).
   */
  characters: ThemeDialogCharacter[];
  /** The character open now, marked in its row. */
  currentCharacterId?: string;
  /** The game, solo games included. Leave it out outside a game. */
  game?: ThemeDialogGame;
  /** The person's app theme, or null for Automatic. */
  appTheme: ThemeChoice;
  /**
   * Called with only the themes that changed. The dialog shows Saving while
   * a returned promise runs, closes when it resolves, and keeps an error in
   * view if it rejects. Nothing changed closes without calling it.
   */
  onSave: (changes: ThemeChange[]) => void | Promise<void>;
  /** The row whose choices start open, such as the character or the game the person came from. */
  initialOpen?: ThemeTarget;
  /** Today, for Automatic's June switch. Defaults to now. */
  date?: Date;
  strings?: Partial<ThemeDialogStrings>;
}

interface ThemeDraft {
  characters: Record<string, ThemeChoice>;
  game: ThemeChoice;
  app: ThemeChoice;
}

function targetKey(target: ThemeTarget) {
  return target.kind === "character" ? `character:${target.id}` : target.kind;
}

/**
 * The rows open at first. A character's row opens the game's instead where
 * characters have no rows (a solo game with one character).
 */
function initialRows(props: ThemeDialogProps) {
  const { initialOpen, game, characters } = props;
  if (!initialOpen) return new Set<string>();
  const hidden =
    initialOpen.kind === "character" &&
    !charactersHaveThemes(game, characters.length);
  return new Set([targetKey(hidden && game ? { kind: "game" } : initialOpen)]);
}

function getSavedDraft(props: ThemeDialogProps): ThemeDraft {
  return {
    characters: Object.fromEntries(
      props.characters.map((character) => [character.id, character.theme]),
    ),
    game: props.game?.theme ?? null,
    app: props.appTheme,
  };
}

const sectionStyles = css({ display: "grid", gap: "1" });
const listStyles = css({ listStyle: "none", margin: 0, padding: 0 });

const markStyles = css({
  display: "inline-flex",
  alignItems: "center",
  paddingInline: "2",
  paddingBlock: "0.5",
  borderRadius: "full",
  background: "accent.soft",
  color: "accent.fg",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "xs",
  letterSpacing: "label",
  textTransform: "uppercase",
  lineHeight: "none",
  whiteSpace: "nowrap",
});

const iconWellStyles = css({
  display: "grid",
  placeItems: "center",
  width: "44px",
  height: "44px",
  borderRadius: "md",
  border: "1px solid token(colors.border.subtle)",
  background: "bg.muted",
  color: "fg.muted",
  "& > svg": { width: "22px", height: "22px" },
});

function IconWell(props: { children: ReactNode }) {
  return (
    <span className={iconWellStyles} aria-hidden>
      {props.children}
    </span>
  );
}

/**
 * Where a person sets every theme that reaches them, in fallback order: each
 * character they can edit in this game, then the game, then their app theme
 * (Everywhere). A solo game with one character shows no character row: the
 * game holds the theme until a second character joins. Each row shows the theme in effect and where it comes from,
 * and opens the scheme choices under it. A form: it edits a draft, Save (or
 * Enter) submits, Cancel discards.
 */
export function ThemeDialog(props: ThemeDialogProps) {
  const {
    open,
    onClose,
    characters,
    currentCharacterId,
    game,
    appTheme,
    onSave,
    date: dateProp,
  } = props;
  const strings = { ...defaultThemeDialogStrings, ...props.strings };

  const [now] = useState(() => new Date());
  const date = dateProp ?? now;
  const isJune = getAutomaticScheme(date) === "pride_traditional";

  const [draft, setDraft] = useState(() => getSavedDraft(props));
  const [openRows, setOpenRows] = useState<Set<string>>(() =>
    initialRows(props),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start from what is saved each time the dialog opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(getSavedDraft(props));
      setOpenRows(initialRows(props));
      setError(null);
    }
  }

  const showCharacters = charactersHaveThemes(game, characters.length);
  const orderedCharacters = useMemo(
    () =>
      showCharacters
        ? [
            ...characters.filter((character) => !character.sharedBy),
            ...characters.filter((character) => character.sharedBy),
          ]
        : [],
    [characters, showCharacters],
  );

  const gameLevel: Pick<ThemeLevels, "game"> = game ? { game: draft.game } : {};

  const changes: ThemeChange[] = [
    ...orderedCharacters
      .filter(
        (character) =>
          (draft.characters[character.id] ?? null) !== character.theme,
      )
      .map((character) => ({
        target: { kind: "character" as const, id: character.id },
        theme: draft.characters[character.id] ?? null,
      })),
    ...(game?.canEdit && draft.game !== game.theme
      ? [{ target: { kind: "game" as const }, theme: draft.game }]
      : []),
    ...(draft.app !== appTheme
      ? [{ target: { kind: "app" as const }, theme: draft.app }]
      : []),
  ];

  const rowProps = (target: ThemeTarget) => {
    const key = targetKey(target);
    return {
      open: openRows.has(key),
      onOpenChange: (next: boolean) =>
        setOpenRows((previous) => {
          const rows = new Set(previous);
          if (next) rows.add(key);
          else rows.delete(key);
          return rows;
        }),
      changed: changes.some((change) => targetKey(change.target) === key),
      strings,
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (changes.length === 0) {
      onClose();
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(changes);
      onClose();
    } catch {
      setError(strings.saveError);
    } finally {
      setSaving(false);
    }
  };

  const charactersHeadingId = useId();
  const gameHeadingId = useId();
  const appHeadingId = useId();

  // Each level's fallback, with the draft applied.
  const gameFallback = resolveTheme({ ...gameLevel, app: draft.app }, date);
  const appFallback = resolveTheme({}, date);
  const appResolved = resolveTheme({ app: draft.app }, date);
  const gameFallbackText = strings.resolved(
    schemes[gameFallback.scheme].label,
    strings.source(gameFallback.source),
  );

  let description = strings.appDescription;
  if (game) {
    description = orderedCharacters.length
      ? strings.description
      : strings.soloDescription;
  }
  let gameMeta: ReactNode = undefined;
  if (game?.solo) gameMeta = strings.soloGameHint(orderedCharacters.length > 0);
  else if (game?.canEdit) gameMeta = strings.gameHint;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      size="md"
      fullScreenOnMobile
    >
      <DialogHeader title={strings.title} />
      <DialogBody>
        <DialogDescription>{description}</DialogDescription>
        {error && (
          <Alert tone="danger" role="alert">
            {error}
          </Alert>
        )}

        {orderedCharacters.length > 0 && (
          <section
            className={sectionStyles}
            aria-labelledby={charactersHeadingId}
          >
            <Text variant="eyebrow" as="h3" id={charactersHeadingId}>
              {strings.charactersHeading}
            </Text>
            <ul className={listStyles}>
              {orderedCharacters.map((character) => {
                const value = draft.characters[character.id] ?? null;
                const resolved = resolveTheme(
                  { character: value, ...gameLevel, app: draft.app },
                  date,
                );
                const isCurrent = character.id === currentCharacterId;
                return (
                  <ThemeRow
                    key={character.id}
                    {...rowProps({ kind: "character", id: character.id })}
                    icon={
                      <CharacterPortrait
                        name={character.name}
                        portraitUrl={character.portraitUrl}
                        crop={character.crop}
                        colorScheme={resolved.scheme}
                        decorative
                      />
                    }
                    name={character.name}
                    marks={
                      isCurrent && (
                        <span className={markStyles}>
                          {strings.currentCharacter}
                        </span>
                      )
                    }
                    meta={
                      character.sharedBy && (
                        <>
                          <Users weight="bold" aria-hidden />
                          {strings.sharedBy(character.sharedBy)}
                        </>
                      )
                    }
                    level="character"
                    resolved={resolved}
                    value={value}
                    onValueChange={(next) =>
                      setDraft((previous) => ({
                        ...previous,
                        characters: {
                          ...previous.characters,
                          [character.id]: next,
                        },
                      }))
                    }
                    fallback={{
                      label: game ? strings.useGameTheme : strings.useAppTheme,
                      scheme: gameFallback.scheme,
                      description: gameFallbackText,
                    }}
                  />
                );
              })}
            </ul>
          </section>
        )}

        {game && (
          <section className={sectionStyles} aria-labelledby={gameHeadingId}>
            <Text variant="eyebrow" as="h3" id={gameHeadingId}>
              {strings.gameHeading}
            </Text>
            <ul className={listStyles}>
              <ThemeRow
                {...rowProps({ kind: "game" })}
                icon={
                  <IconWell>
                    <MapTrifold weight="duotone" />
                  </IconWell>
                }
                name={game.name}
                meta={gameMeta}
                readOnlyReason={
                  game.canEdit
                    ? undefined
                    : (game.readOnlyReason ?? strings.gameReadOnly)
                }
                level="game"
                resolved={gameFallback}
                value={draft.game}
                onValueChange={(next) =>
                  setDraft((previous) => ({ ...previous, game: next }))
                }
                fallback={{
                  label: strings.useAppTheme,
                  scheme: appResolved.scheme,
                  description: game.solo
                    ? strings.resolved(
                        schemes[appResolved.scheme].label,
                        strings.source(appResolved.source),
                      )
                    : strings.useAppThemeForGame,
                }}
              />
            </ul>
          </section>
        )}

        <section className={sectionStyles} aria-labelledby={appHeadingId}>
          <Text variant="eyebrow" as="h3" id={appHeadingId}>
            {strings.appHeading}
          </Text>
          <ul className={listStyles}>
            <ThemeRow
              {...rowProps({ kind: "app" })}
              icon={
                <IconWell>
                  <GlobeHemisphereWest weight="duotone" />
                </IconWell>
              }
              name={strings.appTitle}
              meta={strings.appHint}
              level="app"
              resolved={appResolved}
              value={draft.app}
              onValueChange={(next) =>
                setDraft((previous) => ({ ...previous, app: next }))
              }
              fallback={{
                label: strings.automatic,
                scheme: appFallback.scheme,
                description: strings.automaticDescription(isJune),
              }}
            />
          </ul>
        </section>
      </DialogBody>
      <DialogActions>
        <DialogClose
          render={
            <Button type="button" disabled={saving}>
              {strings.cancel}
            </Button>
          }
        />
        <Button
          type="submit"
          variant="primary"
          loading={saving}
          loadingLabel={strings.saving}
        >
          {strings.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
