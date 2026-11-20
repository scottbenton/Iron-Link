import type { Datasworn } from "@datasworn-community/core";
import { ReactNode, createContext } from "react";

/** A `{{type>id}}` macro in Datasworn's rules text. */
export interface RulesTextMacro {
  /** `table`, `table_columns`, `text`, or another macro name. */
  type: string;
  /** The Datasworn id it names. */
  id: string;
  /** Whether it stands alone as a paragraph (a table) or sits in a sentence. */
  block: boolean;
}

export type RulesTextOracle =
  | Datasworn.OracleRollable
  | Datasworn.EmbeddedOracleRollable;

export interface RulesTextOptions {
  /**
   * Opens a `datasworn:` link, given the id without its prefix. Iron Link
   * opens its Datasworn dialog, or a reference page on /reference. Without
   * it, those links read as plain text in their sentence.
   */
  onLinkClick?: (id: string) => void;
  /**
   * Whether a `datasworn:` id can be opened. An item the page's rules don't
   * have should read as plain text, not a dead link. Defaults to yes.
   */
  canOpenLink?: (id: string) => boolean;
  /** Looks up an oracle named by a `{{table>id}}` macro, to draw its table. */
  resolveOracle?: (id: string) => RulesTextOracle | undefined;
  /**
   * Draws a macro yourself. Return undefined to fall back: oracle tables
   * through `resolveOracle`, inline text as its name, anything else hidden.
   */
  renderMacro?: (macro: RulesTextMacro) => ReactNode | undefined;
}

export const RulesTextContext = createContext<RulesTextOptions>({});
