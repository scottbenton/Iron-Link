/**
 * Ways to show the character at the top of the sheet, for the header
 * options stories and the sheet first layout. Story-only. None shows the
 * player; each puts the character's settings gear beside the name.
 */
import { ReactNode } from "react";

import { css } from "styled-system/css";

import { Text } from "../../components/Text";
import { CharacterPortrait } from "../../game/CharacterPortrait";

export interface CharacterHeaderProps {
  name: string;
  /** The initiative chip. */
  initiative: ReactNode;
  /** The character's settings menu (its gear). */
  gear: ReactNode;
  /**
   * The name's element: h3 under a column heading, p where the name is
   * already the page's h1.
   */
  nameAs?: "h3" | "p";
}

/** A short, a long and a very long name, to see how each option copes. */
export const sampleHeaderNames = [
  "Kira Vale",
  "Seraphina Ashgrove-Blackwater",
  "Captain Isolde Varn-Thessaly of the Ninth Drowned Reach",
];

export type CharacterHeaderOption =
  | "rowClamp"
  | "stackedStart"
  | "stackedCentred"
  | "rowThenStacked"
  | "nameFirst"
  | "oneLine"
  | "card";

export const characterHeaderLabels: Record<CharacterHeaderOption, string> = {
  rowClamp: "A: Row, name clamped to two lines",
  stackedStart: "A2: Stacked, aligned to the start",
  stackedCentred: "A3: Stacked and centred",
  rowThenStacked: "A4: Row, stacking when narrow",
  nameFirst: "B: Name first, never cut",
  oneLine: "C: One line, name truncated",
  card: "D: Card, gear in the corner",
};

const clampStyles = css({ lineClamp: "2", overflowWrap: "anywhere" });
const wrapStyles = css({ overflowWrap: "anywhere" });

/* A: portrait beside, the name wraps to two lines and then clamps. */

const rowStyles = css({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  alignItems: "start",
  columnGap: "3",
});
const rowTextStyles = css({
  display: "grid",
  justifyItems: "start",
  alignSelf: "center",
  gap: "1",
  minWidth: 0,
});

function RowClampHeader(props: CharacterHeaderProps) {
  const { name, initiative, gear, nameAs = "h3" } = props;
  return (
    <div className={rowStyles}>
      <CharacterPortrait name={name} size="lg" shape="rounded" decorative />
      <div className={rowTextStyles}>
        <Text variant="h3" as={nameAs} className={clampStyles}>
          {name}
        </Text>
        {initiative}
      </div>
      {gear}
    </div>
  );
}

/*
 * A2: stacked down the start edge. The portrait and the gear share the top
 * line; the name has the whole width below them, then the chip.
 */

const stackedStyles = css({
  display: "grid",
  justifyItems: "start",
  gap: "2",
});
const topLineStyles = css({
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  alignSelf: "stretch",
  justifySelf: "stretch",
});

function StackedStartHeader(props: CharacterHeaderProps) {
  const { name, initiative, gear, nameAs = "h3" } = props;
  return (
    <div className={stackedStyles}>
      <div className={topLineStyles}>
        <CharacterPortrait name={name} size="xl" shape="rounded" decorative />
        {gear}
      </div>
      <Text variant="h2" as={nameAs} className={wrapStyles}>
        {name}
      </Text>
      {initiative}
    </div>
  );
}

/* A3: stacked and centred, the gear in the top corner. */

const centredStyles = css({
  position: "relative",
  display: "grid",
  justifyItems: "center",
  gap: "2",
  textAlign: "center",
  // Room for the gear on both sides, so the name stays centred.
  paddingInline: "10",
});
const centredCornerStyles = css({
  position: "absolute",
  insetBlockStart: "0",
  insetInlineEnd: "0",
});

function StackedCentredHeader(props: CharacterHeaderProps) {
  const { name, initiative, gear, nameAs = "h3" } = props;
  return (
    <div className={centredStyles}>
      <CharacterPortrait name={name} size="xl" shape="rounded" decorative />
      <Text variant="h2" as={nameAs} className={wrapStyles}>
        {name}
      </Text>
      {initiative}
      <div className={centredCornerStyles}>{gear}</div>
    </div>
  );
}

/*
 * A4: A's row while the column has room for it; below 300px the portrait
 * moves up beside the gear and the name takes the full width, as in A2.
 */

const adaptiveScopeStyles = css({ containerType: "inline-size" });
const adaptiveStyles = css({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  gridTemplateAreas: '"portrait name gear" "portrait chip gear"',
  alignItems: "center",
  justifyItems: "start",
  columnGap: "3",
  rowGap: "1",
  "@container (max-width: 300px)": {
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gridTemplateAreas: '"portrait gear" "name name" "chip chip"',
    alignItems: "start",
    rowGap: "2",
  },
});
const adaptiveNameStyles = css({
  gridArea: "name",
  alignSelf: "end",
  lineClamp: "2",
  overflowWrap: "anywhere",
  "@container (max-width: 300px)": { lineClamp: "none" },
});
const adaptiveAreas = {
  portrait: css({ gridArea: "portrait" }),
  chip: css({ gridArea: "chip", alignSelf: "start" }),
  gear: css({ gridArea: "gear", alignSelf: "start" }),
};

function RowThenStackedHeader(props: CharacterHeaderProps) {
  const { name, initiative, gear, nameAs = "h3" } = props;
  return (
    <div className={adaptiveScopeStyles}>
      <div className={adaptiveStyles}>
        <div className={adaptiveAreas.portrait}>
          <CharacterPortrait name={name} size="lg" shape="rounded" decorative />
        </div>
        <Text variant="h3" as={nameAs} className={adaptiveNameStyles}>
          {name}
        </Text>
        <div className={adaptiveAreas.chip}>{initiative}</div>
        <div className={adaptiveAreas.gear}>{gear}</div>
      </div>
    </div>
  );
}

/* B: the name first, at full width, never cut; portrait and chip below. */

const nameLineStyles = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "start",
  gap: "2",
});
const metaLineStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
});

function NameFirstHeader(props: CharacterHeaderProps) {
  const { name, initiative, gear, nameAs = "h3" } = props;
  return (
    <div className={stackedStyles}>
      <div className={nameLineStyles}>
        <Text variant="h3" as={nameAs} className={wrapStyles}>
          {name}
        </Text>
        {gear}
      </div>
      <div className={metaLineStyles}>
        <CharacterPortrait name={name} size="sm" shape="rounded" decorative />
        {initiative}
      </div>
    </div>
  );
}

/* C: one compact line, the name cut; when narrow the chip drops below. */

const lineGridStyles = css({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
  gridTemplateAreas: '"portrait name chip gear"',
  alignItems: "center",
  columnGap: "2",
  rowGap: "1",
  "@container (max-width: 340px)": {
    gridTemplateColumns: "auto minmax(0, 1fr) auto",
    gridTemplateAreas: '"portrait name gear" "portrait chip gear"',
    justifyItems: "start",
  },
});
const truncateStyles = css({
  gridArea: "name",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
const lineAreas = {
  portrait: css({ gridArea: "portrait" }),
  chip: css({ gridArea: "chip" }),
  gear: css({ gridArea: "gear" }),
};

function OneLineHeader(props: CharacterHeaderProps) {
  const { name, initiative, gear, nameAs = "h3" } = props;
  return (
    <div className={adaptiveScopeStyles}>
      <div className={lineGridStyles}>
        <div className={lineAreas.portrait}>
          <CharacterPortrait name={name} size="md" shape="rounded" decorative />
        </div>
        <Text variant="h4" as={nameAs} className={truncateStyles}>
          {name}
        </Text>
        <div className={lineAreas.chip}>{initiative}</div>
        <div className={lineAreas.gear}>{gear}</div>
      </div>
    </div>
  );
}

/* D: a bordered card, the gear in its corner, the name wrapping freely. */

const cardStyles = css({
  position: "relative",
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  alignItems: "center",
  gap: "3",
  padding: "3",
  paddingInlineEnd: "10",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "lg",
  background: "bg.surface",
});
const cardTextStyles = css({
  display: "grid",
  justifyItems: "start",
  gap: "2",
  minWidth: 0,
});
const cardCornerStyles = css({
  position: "absolute",
  insetBlockStart: "1",
  insetInlineEnd: "1",
});

function CardHeader(props: CharacterHeaderProps) {
  const { name, initiative, gear, nameAs = "h3" } = props;
  return (
    <div className={cardStyles}>
      <CharacterPortrait name={name} size="lg" shape="rounded" decorative />
      <div className={cardTextStyles}>
        <Text variant="h3" as={nameAs} className={wrapStyles}>
          {name}
        </Text>
        {initiative}
      </div>
      <div className={cardCornerStyles}>{gear}</div>
    </div>
  );
}

export const characterHeaders: Record<
  CharacterHeaderOption,
  (props: CharacterHeaderProps) => ReactNode
> = {
  rowClamp: RowClampHeader,
  stackedStart: StackedStartHeader,
  stackedCentred: StackedCentredHeader,
  rowThenStacked: RowThenStackedHeader,
  nameFirst: NameFirstHeader,
  oneLine: OneLineHeader,
  card: CardHeader,
};

/** One of the headers by option. */
export function CharacterHeader(
  props: CharacterHeaderProps & { option: CharacterHeaderOption },
) {
  const { option, ...rest } = props;
  const Header = characterHeaders[option];
  return <Header {...rest} />;
}
