import { ReactNode, useId } from "react";

import { css, cx } from "styled-system/css";

import { Checkbox } from "../../components/Checkbox";
import {
  ImpactsChecklistStrings,
  impactsChecklistWording,
} from "./impactsChecklistStrings";

export interface Impact {
  key: string;
  /** "Wounded". Rules data is lowercase; the first letter is raised here. */
  label: string;
  /** A muted line under the label, such as what it blocks. */
  description?: ReactNode;
}

export interface ImpactGroup {
  key: string;
  /** "Misfortunes", "Conditions", "Vehicle troubles". */
  label: string;
  impacts: Impact[];
}

const rootStyles = css({
  display: "grid",
  gap: "3",
  minWidth: 0,
});

const headStyles = css({
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "3",
});

const titleStyles = css({
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "md",
  lineHeight: "tight",
  textTransform: "uppercase",
  letterSpacing: "label",
});

const countStyles = css({
  fontSize: "sm",
  color: "fg.muted",
  fontVariantNumeric: "tabular-nums",
  "&[data-marked]": { color: "danger.fg", fontWeight: "semibold" },
});

const groupsStyles = css({
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fill, minmax(min(100%, var(--impacts-column, 168px)), 1fr))",
  gap: "4",
});

const fieldsetStyles = css({
  display: "grid",
  alignContent: "start",
  gap: "1",
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: "none",
});

const legendStyles = css({
  padding: 0,
  marginBottom: "1",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "fg.muted",
});

function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export interface ImpactsChecklistProps {
  /** Groups in rules order, such as `rules.impacts` from Datasworn. */
  groups: ImpactGroup[];
  /** Marked impacts by key. A missing key reads as not marked. */
  value: Record<string, boolean | undefined>;
  /** Without it the checklist shows the marks read-only. */
  onChange?: (key: string, marked: boolean) => void;
  disabled?: boolean;
  /** Picks the title wording; `strings` overrides it. */
  wording?: "ironsworn" | "starforged";
  strings?: Partial<ImpactsChecklistStrings>;
  /** The title's element. A span by default, since it labels a group. */
  titleAs?: "span" | "h2" | "h3" | "h4";
  hideTitle?: boolean;
  /** Under the groups, such as "Max momentum +8, reset 0". */
  footer?: ReactNode;
  size?: "sm" | "md";
  className?: string;
}

/**
 * A character's impacts (Starforged) or debilities (Ironsworn): one checkbox
 * per impact, grouped as the rules group them, with a count of marked ones.
 */
export function ImpactsChecklist(props: ImpactsChecklistProps) {
  const {
    groups,
    value,
    onChange,
    disabled,
    wording = "starforged",
    strings: stringsProp,
    titleAs: Title = "span",
    hideTitle,
    footer,
    size = "md",
    className,
  } = props;
  const strings = { ...impactsChecklistWording[wording], ...stringsProp };
  const titleId = useId();

  const known = new Set(
    groups.flatMap((group) => group.impacts.map((impact) => impact.key)),
  );
  const marked = Object.entries(value).filter(
    ([key, isMarked]) => isMarked && known.has(key),
  ).length;

  return (
    <div
      role="group"
      aria-labelledby={hideTitle ? undefined : titleId}
      aria-label={hideTitle ? strings.title : undefined}
      className={cx(rootStyles, className)}
    >
      {!hideTitle && (
        <div className={headStyles}>
          <Title id={titleId} className={titleStyles}>
            {strings.title}
          </Title>
          <span className={countStyles} data-marked={marked || undefined}>
            {strings.count(marked)}
          </span>
        </div>
      )}
      <div className={groupsStyles}>
        {groups.map((group) => (
          <fieldset key={group.key} className={fieldsetStyles}>
            <legend className={legendStyles}>
              {sentenceCase(group.label)}
            </legend>
            {group.impacts.map((impact) => (
              <Checkbox
                key={impact.key}
                size={size}
                label={sentenceCase(impact.label)}
                description={impact.description}
                checked={!!value[impact.key]}
                onCheckedChange={(checked) => onChange?.(impact.key, checked)}
                readOnly={!onChange}
                disabled={disabled}
              />
            ))}
          </fieldset>
        ))}
      </div>
      {footer && (
        <div className={css({ fontSize: "sm", color: "fg.muted" })}>
          {footer}
        </div>
      )}
    </div>
  );
}
