import { useContext } from "react";

import { RulesTextContext, RulesTextOptions } from "./RulesTextContext";

/** The RulesText options in effect here. */
export function useRulesTextOptions(): RulesTextOptions {
  return useContext(RulesTextContext);
}
