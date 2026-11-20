import { ComponentPropsWithoutRef, ReactNode, useMemo } from "react";
import ReactMarkdown, { Components, defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { cx } from "styled-system/css";

import { OracleTable } from "../OracleTable";
import {
  RulesTextMacro,
  RulesTextOptions,
  mergeRulesTextOptions,
  useRulesTextOptions,
} from "./RulesTextContext";
import {
  INLINE_MACRO_SCHEME,
  parseBlockMacro,
  parseInlineMacro,
  prepareMarkdown,
} from "./macros";
import {
  compactTableStyles,
  rulesLinkStyles,
  rulesTextStyles,
  tableScrollStyles,
} from "./rulesTextStyles";

const DATASWORN_SCHEME = "datasworn:";
const TABLE_MACROS = new Set(["table"]);

export interface RulesTextProps
  extends CssProp,
    RulesTextOptions,
    Omit<ComponentPropsWithoutRef<"div">, "children" | "color"> {
  /** Datasworn markdown: a move's text, an ability, a requirement. */
  markdown: string;
  /** `sm` inside cards and rows, `md` on a page or dialog. */
  size?: "sm" | "md";
  /** `muted` for secondary text such as an asset's requirement. */
  color?: "default" | "muted" | "inherit";
  className?: string;
}

/**
 * Datasworn rules text in the library's type: bold triggers, lists, compact
 * tables, `datasworn:` links that open through `onLinkClick`, and oracle
 * tables where the text names one with a `{{table>id}}` macro. Link and
 * oracle handling can come from a `RulesTextProvider` instead of props.
 */
export function RulesText(props: RulesTextProps) {
  const {
    markdown,
    size,
    color,
    className,
    onLinkClick,
    canOpenLink,
    resolveOracle,
    renderMacro,
    ...rest
  } = withCssProp(props);

  const contextOptions = useRulesTextOptions();
  const options = mergeRulesTextOptions(contextOptions, {
    onLinkClick,
    canOpenLink,
    resolveOracle,
    renderMacro,
  });

  const prepared = useMemo(() => prepareMarkdown(markdown), [markdown]);
  const components = getComponents(options, size ?? "md");

  return (
    <div className={cx(rulesTextStyles({ size, color }), className)} {...rest}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        urlTransform={transformUrl}
      >
        {prepared}
      </ReactMarkdown>
    </div>
  );
}

/** Keeps our own schemes and makes anything else safe as usual. */
function transformUrl(url: string) {
  if (url.startsWith(DATASWORN_SCHEME) || url.startsWith(INLINE_MACRO_SCHEME)) {
    return url;
  }
  return defaultUrlTransform(url);
}

function renderBlockMacro(
  macro: RulesTextMacro,
  options: RulesTextOptions,
  size: "sm" | "md",
): ReactNode {
  const custom = options.renderMacro?.(macro);
  if (custom !== undefined) return custom;
  if (TABLE_MACROS.has(macro.type)) {
    const oracle = options.resolveOracle?.(macro.id);
    if (oracle) {
      return (
        <OracleTable
          oracle={oracle}
          hideHeader
          size={size}
          className={tableScrollStyles}
        />
      );
    }
  }
  // Truths, column tables and anything unknown have no place in the text.
  return null;
}

function getComponents(
  options: RulesTextOptions,
  size: "sm" | "md",
): Components {
  return {
    p: ({ node, children }) => {
      const only = node?.children.length === 1 ? node.children[0] : undefined;
      if (only?.type === "text") {
        const macro = parseBlockMacro(only.value);
        if (macro) return renderBlockMacro(macro, options, size);
      }
      return <p>{children}</p>;
    },
    h1: HeadingLike,
    h2: HeadingLike,
    h3: HeadingLike,
    h4: HeadingLike,
    h5: HeadingLike,
    h6: HeadingLike,
    table: ({ children }) => (
      <div className={tableScrollStyles}>
        <table className={compactTableStyles}>{children}</table>
      </div>
    ),
    a: ({ href, children }) => {
      const url = href ?? "";

      const macro = parseInlineMacro(url);
      if (macro) {
        const custom = options.renderMacro?.(macro);
        return custom !== undefined ? custom : <>{children}</>;
      }

      if (url.startsWith(DATASWORN_SCHEME)) {
        const id = url.slice(DATASWORN_SCHEME.length);
        const { onLinkClick } = options;
        if (onLinkClick && (options.canOpenLink?.(id) ?? true)) {
          return (
            <button
              type="button"
              className={rulesLinkStyles}
              onClick={() => onLinkClick(id)}
            >
              {children}
            </button>
          );
        }
        // An item these rules don't have reads as plain text in its sentence.
        return <>{children}</>;
      }

      if (/^(https?:|mailto:)/i.test(url)) {
        return (
          <a href={url} className={rulesLinkStyles}>
            {children}
          </a>
        );
      }
      return <>{children}</>;
    },
  };
}

/**
 * Headings inside rules text are labels within someone else's section, so
 * they look like headings without joining the page's outline.
 */
function HeadingLike(props: { children?: ReactNode }) {
  return <p data-rules-heading="">{props.children}</p>;
}
