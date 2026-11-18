import { UserMinusIcon } from "@phosphor-icons/react";

import { css } from "styled-system/css";

import { IconButton } from "../../components/IconButton";
import { Link } from "../../components/Link";
import { EmptyState } from "../../layout/EmptyState";
import { TracksPanelSection } from "./TracksPanelSection";
import type { TracksPanelStrings } from "./tracksPanelStrings";
import type { BondItem } from "./tracksPanelTypes";

const listStyles = css({
  display: "grid",
  margin: 0,
  padding: 0,
  listStyle: "none",
});

const rowStyles = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "2",
  minHeight: "40px",
  paddingInlineStart: "1",
  borderBottom: "1px solid token(colors.border.subtle)",
  fontSize: "md",
  _touch: { minHeight: "touch" },
  _last: { borderBottomWidth: 0 },
});

export interface BondsSectionProps {
  bonds: BondItem[];
  readOnly: boolean;
  onClear?: (id: string) => void;
  headingAs: "h2" | "h3" | "h4";
  strings: TracksPanelStrings;
}

/**
 * Ironsworn bonds with world entries: each links to its entry, where bonds
 * are formed, and can be cleared here.
 */
export function BondsSection(props: BondsSectionProps) {
  const { bonds, readOnly, onClear, headingAs, strings } = props;
  return (
    <TracksPanelSection
      title={strings.bonds}
      headingAs={headingAs}
      count={bonds.length}
    >
      {bonds.length === 0 ? (
        <EmptyState size="sm" message={strings.noBonds} />
      ) : (
        <ul className={listStyles}>
          {bonds.map((bond) => (
            <li key={bond.id} className={rowStyles}>
              {bond.href ? (
                <Link href={bond.href} color="default" underline="hover">
                  {bond.label}
                </Link>
              ) : (
                <span>{bond.label}</span>
              )}
              {!readOnly && onClear && (
                <IconButton
                  label={strings.clearBondLabel(bond.label)}
                  size="sm"
                  onClick={() => onClear(bond.id)}
                >
                  <UserMinusIcon />
                </IconButton>
              )}
            </li>
          ))}
        </ul>
      )}
    </TracksPanelSection>
  );
}
