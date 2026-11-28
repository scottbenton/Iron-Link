import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { CssProp, withCssProp } from "ui/styles/cssProp";
import { SchemeName, getSchemeLabels, schemeNames } from "ui/theme";

import { css } from "styled-system/css";

import { RadioCard, RadioCardGroup } from "../../components/RadioCard";
import { SchemeScope } from "../../components/SchemeScope";
import { SchemeSwatch } from "../SchemeSwatch";

/**
 * A scheme's card is narrow (two to a row at phone width), so its swatch is
 * 32px and the check sits on the swatch's corner as a badge instead of
 * keeping a slot after the name. Long names such as Hinterlands keep one
 * line. The card's padding (12px) and border (1px) place the badge.
 */
const schemeCardStyles = css({
  "& [data-frame]": { width: "32px", height: "32px" },
  "& span[aria-hidden]:not([data-frame])": {
    position: "absolute",
    top: "calc(token(spacing.3) + 1px + 32px - 13px)",
    insetInlineStart: "calc(token(spacing.3) + 1px + 32px - 13px)",
    width: "18px",
    height: "18px",
    borderRadius: "full",
    background: "bg.surface",
    "& > svg": { width: "icon.md", height: "icon.md" },
  },
});

/** The radio value that stands for the fallback option. */
const FALLBACK_VALUE = "__fallback";

/**
 * An option before the schemes that sets no scheme of its own, such as
 * "Use the game's theme". Its swatch shows the scheme it falls back to.
 */
export interface ColorSchemeFallbackOption {
  /** What the option says, such as "Use the game's theme". */
  label: ReactNode;
  /** The scheme in effect when it is chosen, shown as its swatch. */
  scheme: SchemeName;
  /** A second line, such as "Eidolon, from this game". */
  description?: ReactNode;
}

interface ColorSchemePickerCommonProps extends CssProp {
  /** Names for each scheme, for translation. Defaults to the scheme's label. */
  labels?: Partial<Record<SchemeName, string>>;
  /** Which schemes to offer, in order. All nine by default. */
  options?: SchemeName[];
  disabled?: boolean;
  /** The group's accessible name. */
  "aria-label"?: string;
  /** Or a visible label above the cards. */
  label?: ReactNode;
  className?: string;
}

interface ColorSchemePickerSchemeOnlyProps {
  value: SchemeName;
  onValueChange: (scheme: SchemeName) => void;
  fallback?: undefined;
}

interface ColorSchemePickerWithFallbackProps {
  /** The chosen scheme, or null for the fallback option. */
  value: SchemeName | null;
  onValueChange: (scheme: SchemeName | null) => void;
  /** Adds a first option that sets no scheme; choosing it gives null. */
  fallback: ColorSchemeFallbackOption;
}

export type ColorSchemePickerProps = ColorSchemePickerCommonProps &
  (ColorSchemePickerSchemeOnlyProps | ColorSchemePickerWithFallbackProps);

/**
 * Iron Link's colour schemes as small RadioCards, each showing its scheme's
 * ring gradient as a swatch, like the Theme dialog's rows; the chosen card's border and check are its scheme's
 * accent too. With `fallback`, a first option sets no scheme
 * (value null), for a level that can inherit from another (ThemeDialog).
 */
export function ColorSchemePicker(props: ColorSchemePickerProps) {
  const {
    value,
    labels,
    options = schemeNames,
    disabled,
    className,
    fallback,
    label,
    "aria-label": ariaLabel,
  } = withCssProp(props);
  const { t } = useTranslation();
  const schemeLabels = getSchemeLabels(t);

  const handleChange = (next: string) => {
    if (props.fallback) {
      props.onValueChange(
        next === FALLBACK_VALUE ? null : (next as SchemeName),
      );
    } else {
      props.onValueChange(next as SchemeName);
    }
  };

  return (
    <RadioCardGroup<string>
      value={value ?? FALLBACK_VALUE}
      onValueChange={handleChange}
      disabled={disabled}
      label={label}
      aria-label={
        label
          ? undefined
          : (ariaLabel ?? t("ui.color-scheme-picker.label", "Colour scheme"))
      }
      minCardWidth="160px"
      className={className}
    >
      {fallback && (
        <SchemeScope scheme={fallback.scheme}>
          <RadioCard
            value={FALLBACK_VALUE}
            title={fallback.label}
            description={fallback.description}
            size="sm"
            iconFrame="none"
            icon={<SchemeSwatch scheme={fallback.scheme} size="lg" />}
            css={{ gridColumn: "1 / -1" }}
          />
        </SchemeScope>
      )}
      {options.map((name) => (
        <SchemeScope key={name} scheme={name}>
          <RadioCard
            value={name}
            title={labels?.[name] ?? schemeLabels[name]}
            size="sm"
            className={schemeCardStyles}
            iconFrame="none"
            icon={<SchemeSwatch scheme={name} size="md" />}
          />
        </SchemeScope>
      ))}
    </RadioCardGroup>
  );
}
