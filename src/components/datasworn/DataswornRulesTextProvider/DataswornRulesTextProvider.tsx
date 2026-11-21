import { PropsWithChildren, useCallback } from "react";

import { useDataswornLinkHandler } from "components/datasworn/useDataswornLinkHandler";

import { RulesTextProvider } from "ui/game/RulesText";

import {
  canOpenDataswornLink,
  getDataswornLinkId,
} from "./dataswornRulesTextLinks";
import { useLegacyIdMap } from "./useLegacyIdMap";

/**
 * Gives every RulesText inside the app's link rules: a `datasworn:` link
 * opens through `useDataswornLinkHandler` (the Datasworn dialog, or the
 * page's own handler) when the loaded rules have the item. No oracle lookup:
 * a move's tables come from its own oracles, and outcome text in roll
 * results repeats the move's table macros, which should draw nothing there.
 */
export function DataswornRulesTextProvider(props: PropsWithChildren) {
  const { children } = props;
  const openLink = useDataswornLinkHandler();
  const idMap = useLegacyIdMap();

  const onLinkClick = useCallback(
    (id: string) => openLink(getDataswornLinkId(id, idMap)),
    [openLink, idMap],
  );
  const canOpenLink = useCallback(
    (id: string) => canOpenDataswornLink(id, idMap),
    [idMap],
  );

  return (
    <RulesTextProvider onLinkClick={onLinkClick} canOpenLink={canOpenLink}>
      {children}
    </RulesTextProvider>
  );
}
