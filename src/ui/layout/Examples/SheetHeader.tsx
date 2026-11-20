import { css } from "styled-system/css";

import { Text } from "../../components/Text";
import { CharacterPortrait } from "../../game/CharacterPortrait";
import { AddsControl } from "../../game/ConditionMeter";
import { InitiativeChip } from "../../game/InitiativeChip";
import { DemoCharacterSettingsMenu } from "../SettingsMenu/SettingsMenuDemo";
import { guideScenario } from "../SettingsMenu/settingsMenuScenarios";
import { PlaySheet } from "./usePlaySheet";

/* ------------------------------------------------------------------------ */
/* Sheet pieces                                                             */
/* ------------------------------------------------------------------------ */

/**
 * The character across the top of the sheet, with no card: the portrait,
 * the name with initiative under it, then the Adds chip and the
 * character's settings gear at the end. Set adds show as a badge on every
 * stat and meter below, so the chip can sit up here. When the column is
 * narrow the chip drops to its own line and the gear stays at the top. The
 * name is the page's h1 already.
 */
export function SheetHeader(props: {
  sheet: PlaySheet;
  name: string;
  touch?: boolean;
}) {
  const { sheet, name, touch } = props;
  return (
    <div className={headerStyles.root}>
      <div className={headerStyles.portrait}>
        <CharacterPortrait
          name={name}
          size="lg"
          shape="rounded"
          colorScheme="cinder"
          decorative
        />
      </div>
      <div className={headerStyles.identity}>
        <Text variant="h3" as="p" className={headerStyles.name}>
          {name}
        </Text>
        <InitiativeChip
          status={sheet.initiative}
          onStatusChange={sheet.setInitiative}
        />
      </div>
      <AddsControl
        value={sheet.adds}
        onChange={sheet.setAdds}
        stepperSize={touch ? "touch" : "sm"}
        className={headerStyles.adds}
      />
      <div className={headerStyles.gear}>
        <DemoCharacterSettingsMenu
          scenario={{ ...guideScenario, character: { name, isOwner: true } }}
        />
      </div>
    </div>
  );
}

const headerStyles = {
  root: css({
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr) auto",
    gridTemplateAreas: '"portrait identity gear" "portrait adds adds"',
    alignItems: "center",
    columnGap: "3",
    rowGap: "2",
    minWidth: 0,
    "@container sheet (min-width: 560px)": {
      gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
      gridTemplateAreas: '"portrait identity adds gear"',
    },
  }),
  portrait: css({ gridArea: "portrait", alignSelf: "start" }),
  identity: css({
    gridArea: "identity",
    display: "grid",
    justifyItems: "start",
    gap: "1",
    minWidth: 0,
  }),
  name: css({ overflowWrap: "anywhere" }),
  adds: css({ gridArea: "adds", justifySelf: "start" }),
  gear: css({ gridArea: "gear", justifySelf: "end" }),
};
