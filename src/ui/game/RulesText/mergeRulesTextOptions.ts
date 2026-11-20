import { RulesTextOptions } from "./RulesTextContext";

/** Options from `override` where set, else from `base`. */
export function mergeRulesTextOptions(
  base: RulesTextOptions,
  override: RulesTextOptions,
): RulesTextOptions {
  return {
    onLinkClick: override.onLinkClick ?? base.onLinkClick,
    canOpenLink: override.canOpenLink ?? base.canOpenLink,
    resolveOracle: override.resolveOracle ?? base.resolveOracle,
    renderMacro: override.renderMacro ?? base.renderMacro,
  };
}
