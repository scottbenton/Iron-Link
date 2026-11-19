import { ReactNode } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";
import { SchemeName, schemeNames, schemes } from "ui/theme";

import { css } from "styled-system/css";

import { IronLinkMark } from "../../components/IronLinkMark";
import { RadioCard, RadioCardGroup } from "../../components/RadioCard";

const markStyles = css({ width: "40px", height: "40px" });
const schemeMarkStyles = css({ width: "32px", height: "32px" });

/**
 * A scheme's card is narrow (two to a row at phone width), so its mark is
 * 32px and the check sits on the mark's corner as a badge instead of
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
 * "Use the game's theme". Its logo shows the scheme it falls back to.
 */
export interface ColorSchemeFallbackOption {
  /** What the option says, such as "Use the game's theme". */
  label: ReactNode;
  /** The scheme in effect when it is chosen, shown as its logo. */
  scheme: SchemeName;
  /** A second line, such as "Eidolon, from this game". */
  description?: ReactNode;
}

interface ColorSchemePickerCommonProps extends LayoutProps {
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
 * Iron Link's colour schemes as small RadioCards, each showing the logo in
 * its scheme's colours. With `fallback`, a first option sets no scheme
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
  } = withLayoutProps(props);

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
      aria-label={label ? undefined : (ariaLabel ?? "Colour scheme")}
      minCardWidth="160px"
      className={className}
    >
      {fallback && (
        <RadioCard
          value={FALLBACK_VALUE}
          title={fallback.label}
          description={fallback.description}
          size="sm"
          iconFrame="none"
          icon={
            <IronLinkMark
              colors={schemes[fallback.scheme].icon}
              className={markStyles}
            />
          }
          gridColumn="1 / -1"
        />
      )}
      {options.map((name) => (
        <RadioCard
          key={name}
          value={name}
          title={labels?.[name] ?? schemes[name].label}
          size="sm"
          className={schemeCardStyles}
          iconFrame="none"
          icon={
            <IronLinkMark
              colors={schemes[name].icon}
              className={schemeMarkStyles}
            />
          }
        />
      ))}
    </RadioCardGroup>
  );
}
