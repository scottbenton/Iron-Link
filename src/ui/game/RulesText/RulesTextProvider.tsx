import { PropsWithChildren, useContext, useMemo } from "react";

import { RulesTextContext, RulesTextOptions } from "./RulesTextContext";
import { mergeRulesTextOptions } from "./mergeRulesTextOptions";

export interface RulesTextProviderProps
  extends RulesTextOptions,
    PropsWithChildren {}

/**
 * Sets link handling and oracle lookup for every RulesText inside, so asset
 * cards, moves and oracle tables need no props for it. Props on a RulesText
 * win over the provider.
 */
export function RulesTextProvider(props: RulesTextProviderProps) {
  const { children, onLinkClick, canOpenLink, resolveOracle, renderMacro } =
    props;
  const parent = useContext(RulesTextContext);
  const value = useMemo(
    () =>
      mergeRulesTextOptions(parent, {
        onLinkClick,
        canOpenLink,
        resolveOracle,
        renderMacro,
      }),
    [parent, onLinkClick, canOpenLink, resolveOracle, renderMacro],
  );
  return (
    <RulesTextContext.Provider value={value}>
      {children}
    </RulesTextContext.Provider>
  );
}
