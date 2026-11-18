import { Collapsible } from "@base-ui/react/collapsible";
import type { Datasworn } from "@datasworn-community/core";
import { CaretDown } from "@phosphor-icons/react";
import {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
  useState,
} from "react";

import { Button } from "ui/components/Button";
import { Text } from "ui/components/Text";
import { VisuallyHidden } from "ui/components/VisuallyHidden";
import { RollButton } from "ui/game/RollButton";
import { formatSigned } from "ui/game/shared";

import { css, cx } from "styled-system/css";

import { OracleTable } from "../OracleTable/OracleTable";
import { RulesText } from "../RulesText/RulesText";
import {
  RulesTextMacro,
  RulesTextOptions,
} from "../RulesText/RulesTextContext";
import {
  collapsiblePanelStyles,
  contentCardStyles,
  disclosureChevronStyles,
} from "./cardStyles";
import {
  MoveRollOption,
  getMoveCategoryFromId,
  getMoveOracles,
} from "./moveData";

const cardStyles = css({ gap: "3" });

const variantStyles = {
  card: cx(contentCardStyles, css({ padding: "4" })),
  plain: css({ display: "flex", flexDirection: "column", minWidth: 0 }),
};

const headerStyles = css({
  display: "flex",
  alignItems: "flex-start",
  gap: "3",
  "& > [data-titles]": {
    flex: "1",
    minWidth: 0,
    display: "grid",
    gap: "0.5",
  },
  "& > [data-actions]": {
    display: "flex",
    alignItems: "center",
    gap: "1",
    flex: "none",
    marginBlock: "-1",
    marginInlineEnd: "-1",
  },
});

const titleButtonStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  maxWidth: "100%",
  padding: 0,
  margin: 0,
  border: 0,
  borderRadius: "sm",
  background: "transparent",
  color: "inherit",
  font: "inherit",
  letterSpacing: "inherit",
  textAlign: "left",
  cursor: "pointer",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  "& svg": { color: "fg.muted" },
  _hover: { "& svg": { color: "fg.default" } },
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "2px",
  },
});

const sectionStyles = css({
  display: "grid",
  gap: "2",
  justifyItems: "start",
});

const rollRowStyles = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
});

const rollValueStyles = css({
  opacity: 0.8,
  fontVariantNumeric: "tabular-nums",
});

const oracleTablesStyles = css({
  display: "grid",
  gap: "4",
  paddingBlockStart: "1",
  width: "100%",
});

export interface MoveCardProps
  extends RulesTextOptions,
    Omit<ComponentPropsWithoutRef<"article">, "children"> {
  move: Datasworn.AnyMove;
  /** The eyebrow above the name. Falls back to the category in the move's id. */
  category?: string;
  /** Ways to roll this move; each is a roll button. */
  rollOptions?: MoveRollOption[];
  onRoll?: (option: MoveRollOption) => void;
  /** The label above the roll buttons. */
  rollWithLabel?: string;
  /** Rolls one of the move's own oracles (Pay the Price, Ask the Oracle's odds). */
  onRollOracle?: (oracle: Datasworn.EmbeddedOracleRollable) => void;
  /** Highlights a rolled row in an embedded oracle's table, by oracle id. */
  rolledOracleRows?: Record<string, string>;
  /**
   * Shows only the trigger until the name is pressed, then the full text and
   * oracles. Roll buttons stay visible either way.
   */
  collapsible?: boolean;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Whether the embedded oracle tables start shown. */
  defaultOraclesShown?: boolean;
  showOraclesLabel?: string;
  hideOraclesLabel?: string;
  /** Buttons in the header, such as Pin or Open in Reference. */
  actions?: ReactNode;
  /** The element for the move's name, so headings nest. An h3 by default. */
  headingAs?: ElementType;
  /** Hides the name, where a list row above already shows it. */
  hideName?: boolean;
  /** `card` on its own; `plain` (no border or padding) inside a list or dialog. */
  variant?: "card" | "plain";
  className?: string;
}

/**
 * A move: category, name, rules text with its trigger and outcomes, a roll
 * button per stat or track, and its embedded oracles behind "Show oracles".
 */
export function MoveCard(props: MoveCardProps) {
  const {
    move,
    category,
    rollOptions = [],
    onRoll,
    rollWithLabel = "Roll with",
    onRollOracle,
    rolledOracleRows,
    collapsible = false,
    expanded: expandedProp,
    defaultExpanded = false,
    onExpandedChange,
    defaultOraclesShown = false,
    showOraclesLabel = "Show oracles",
    hideOraclesLabel = "Hide oracles",
    actions,
    headingAs = "h3",
    hideName,
    variant = "card",
    className,
    onLinkClick,
    canOpenLink,
    resolveOracle,
    renderMacro,
    ...rest
  } = props;

  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const expanded = !collapsible || (expandedProp ?? expandedState);
  const setExpanded = (next: boolean) => {
    setExpandedState(next);
    onExpandedChange?.(next);
  };

  const [oraclesShown, setOraclesShown] = useState(defaultOraclesShown);

  const oracles = getMoveOracles(move);
  const eyebrow = category ?? getMoveCategoryFromId(move._id);

  // The move's own tables live in the Oracles section, so the text skips
  // the macros that name them (and Ask the Oracle's column macro).
  const renderMoveMacro = (macro: RulesTextMacro) => {
    const custom = renderMacro?.(macro);
    if (custom !== undefined) return custom;
    if (macro.id === move._id) return null;
    if (oracles.some((oracle) => oracle._id === macro.id)) return null;
    return undefined;
  };

  const rulesOptions: RulesTextOptions = {
    onLinkClick,
    canOpenLink,
    resolveOracle,
    renderMacro: renderMoveMacro,
  };

  const triggerText = move.trigger.text;

  const nameNode = collapsible ? (
    <Collapsible.Trigger className={titleButtonStyles}>
      {move.name}
      <CaretDown className={disclosureChevronStyles} aria-hidden />
    </Collapsible.Trigger>
  ) : (
    move.name
  );

  const body = (
    <>
      <RulesText markdown={move.text} size="sm" {...rulesOptions} />
      {oracles.length > 0 && (
        <Collapsible.Root
          open={oraclesShown}
          onOpenChange={setOraclesShown}
          className={sectionStyles}
        >
          {onRollOracle && (
            <div className={rollRowStyles}>
              {oracles.map((oracle) => (
                <RollButton
                  key={oracle._id}
                  size="sm"
                  onClick={() => onRollOracle(oracle)}
                >
                  {oracle.name}
                </RollButton>
              ))}
            </div>
          )}
          <Collapsible.Trigger
            render={<Button variant="text" size="sm" />}
            className={css({ marginInlineStart: "-2" })}
          >
            {oraclesShown ? hideOraclesLabel : showOraclesLabel}
            <CaretDown className={disclosureChevronStyles} aria-hidden />
          </Collapsible.Trigger>
          <Collapsible.Panel className={collapsiblePanelStyles}>
            <div className={oracleTablesStyles}>
              {oracles.map((oracle) => (
                <OracleTable
                  key={oracle._id}
                  oracle={oracle}
                  titleAs="p"
                  rolledRowId={rolledOracleRows?.[oracle._id]}
                />
              ))}
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
      )}
    </>
  );

  return (
    <Collapsible.Root
      open={expanded}
      onOpenChange={setExpanded}
      render={<article />}
      className={cx(variantStyles[variant], cardStyles, className)}
      {...rest}
    >
      {(!hideName || actions || eyebrow) && (
        <header className={headerStyles}>
          <div data-titles="">
            {eyebrow && (
              <Text variant="eyebrow" as="p">
                {eyebrow}
              </Text>
            )}
            {!hideName && (
              <Text variant="h3" as={headingAs}>
                {nameNode}
              </Text>
            )}
          </div>
          {actions && <div data-actions="">{actions}</div>}
        </header>
      )}

      {collapsible && !expanded && triggerText && (
        <RulesText
          markdown={triggerText}
          size="sm"
          color="muted"
          {...rulesOptions}
        />
      )}

      {rollOptions.length > 0 && (
        <div
          className={sectionStyles}
          role="group"
          aria-label={`${rollWithLabel}: ${move.name}`}
        >
          <Text variant="label" color="muted">
            {rollWithLabel}
          </Text>
          <div className={rollRowStyles}>
            {rollOptions.map((option) => (
              <RollButton
                key={option.id}
                size="sm"
                disabled={option.disabled}
                onClick={() => onRoll?.(option)}
              >
                <VisuallyHidden>{rollWithLabel} </VisuallyHidden>
                {option.label}
                {option.value !== undefined && (
                  <span className={rollValueStyles}>
                    {" "}
                    {formatSigned(option.value)}
                  </span>
                )}
              </RollButton>
            ))}
          </div>
        </div>
      )}

      {collapsible ? (
        <Collapsible.Panel className={collapsiblePanelStyles}>
          <div className={css({ display: "grid", gap: "3" })}>{body}</div>
        </Collapsible.Panel>
      ) : (
        body
      )}
    </Collapsible.Root>
  );
}
