import { CaretDown, LockSimple } from "@phosphor-icons/react";
import { ReactNode, useId } from "react";

import { Button } from "ui/components/Button";
import { Collapse } from "ui/components/Collapsible";
import { schemes } from "ui/theme";

import { css } from "styled-system/css";

import {
  ColorSchemeFallbackOption,
  ColorSchemePicker,
} from "../ColorSchemePicker";
import { SchemeSwatch } from "./SchemeSwatch";
import { ResolvedTheme, ThemeChoice, ThemeSource } from "./resolveTheme";
import { ThemeDialogStrings } from "./themeDialogStrings";

const rowStyles = css({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  gridTemplateAreas: '"icon text action" "panel panel panel"',
  alignItems: "center",
  columnGap: "3",
  paddingBlock: "3",
  borderBottom: "1px solid token(colors.border.subtle)",
  _last: { borderBottom: 0 },
  "& [data-row-icon]": { gridArea: "icon", alignSelf: "start" },
  "& [data-row-text]": {
    gridArea: "text",
    display: "grid",
    gap: "0.5",
    minWidth: 0,
  },
  "& [data-row-action]": { gridArea: "action" },
  "& [data-row-panel]": { gridArea: "panel" },
  // At phone width the text keeps the row's width and Change goes under it,
  // in line with the name, rather than squeezing the hint into a column.
  "@container theme-rows (max-width: 419.98px)": {
    gridTemplateColumns: "auto minmax(0, 1fr)",
    gridTemplateAreas: '"icon text" "icon action" "panel panel"',
    rowGap: "2",
    "& [data-row-action]": { justifySelf: "start" },
  },
});

const titleLineStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "baseline",
  columnGap: "2",
  rowGap: "1",
  minWidth: 0,
});

const nameStyles = css({
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "md",
  lineHeight: "snug",
  color: "fg.default",
  overflowWrap: "anywhere",
  minWidth: 0,
});

const metaStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
  margin: 0,
  fontSize: "sm",
  lineHeight: "snug",
  color: "fg.muted",
  "& > svg": { flex: "none", width: "icon.sm", height: "icon.sm" },
});

const resolvedStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  columnGap: "2",
  rowGap: "0.5",
  margin: 0,
  fontSize: "sm",
  lineHeight: "snug",
  color: "fg.default",
  "& [data-changed]": { color: "accent.fg", fontWeight: "semibold" },
});

const caretStyles = css({
  transition: "rotate token(durations.normal) token(easings.out)",
  _reducedMotion: { transition: "none" },
  "[aria-expanded=true] &": { rotate: "180deg" },
});

const panelInnerStyles = css({ paddingBlockStart: "3" });

export interface ThemeRowProps {
  /** A portrait or an icon well, 44px. */
  icon: ReactNode;
  /** The row's name, used in its control's accessible name too. */
  name: string;
  /** Marks beside the name, such as "Open now". */
  marks?: ReactNode;
  /** A line under the name, such as "Shared by Sam". */
  meta?: ReactNode;
  /** The level this row sets, so its own choice reads "set here". */
  level: Exclude<ThemeSource, "automatic">;
  /** The theme in effect for this row, with the draft applied. */
  resolved: ResolvedTheme;
  value: ThemeChoice;
  onValueChange: (value: ThemeChoice) => void;
  /** The option that sets no theme on this row. */
  fallback: ColorSchemeFallbackOption;
  /** Shows what is in effect with a reason, and no control. */
  readOnlyReason?: string;
  /** The draft differs from what is saved. */
  changed?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strings: ThemeDialogStrings;
}

/**
 * One target in ThemeDialog: who or what it is, the theme in effect and
 * where that comes from, and a Change button that opens the scheme choices
 * under the row.
 */
export function ThemeRow(props: ThemeRowProps) {
  const {
    icon,
    name,
    marks,
    meta,
    level,
    resolved,
    value,
    onValueChange,
    fallback,
    readOnlyReason,
    changed,
    open,
    onOpenChange,
    strings,
  } = props;

  const panelId = useId();
  const source = strings.source(
    resolved.source === level ? "own" : resolved.source,
  );

  return (
    <li className={rowStyles}>
      <span data-row-icon="">{icon}</span>
      <div data-row-text="">
        <div className={titleLineStyles}>
          <span className={nameStyles}>{name}</span>
          {marks}
        </div>
        {meta && <p className={metaStyles}>{meta}</p>}
        {readOnlyReason && (
          <p className={metaStyles}>
            <LockSimple weight="bold" aria-hidden />
            {readOnlyReason}
          </p>
        )}
        <p className={resolvedStyles}>
          <SchemeSwatch scheme={resolved.scheme} />
          <span>
            {strings.resolved(schemes[resolved.scheme].label, source)}
          </span>
          {changed && <span data-changed="">{strings.changed}</span>}
        </p>
      </div>
      {!readOnlyReason && (
        <>
          <span data-row-action="">
            <Button
              variant="ghost"
              endIcon={<CaretDown className={caretStyles} weight="bold" />}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={strings.changeLabel(name)}
              onClick={() => onOpenChange(!open)}
            >
              {strings.change}
            </Button>
          </span>
          <div data-row-panel="">
            <Collapse open={open} id={panelId} keepMounted>
              <div className={panelInnerStyles}>
                <ColorSchemePicker
                  value={value}
                  onValueChange={onValueChange}
                  fallback={fallback}
                  aria-label={strings.pickerLabel(name)}
                />
              </div>
            </Collapse>
          </div>
        </>
      )}
    </li>
  );
}
