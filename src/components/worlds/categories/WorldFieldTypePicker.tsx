import { RadioCardGroup } from "components/RadioCard";

import { WORLD_FIELD_KINDS, type WorldFieldKind } from "lib/worldFieldRules";

import { WorldFieldTypeCard } from "./WorldFieldTypeCard";

// The four field kinds as a radio group: a grid on wide screens and one column
// on phones.
export function WorldFieldTypePicker({
  value,
  label,
  disabled,
  getDisabledReason,
  onChange,
  onCreateNew,
}: {
  value: WorldFieldKind;
  label: string;
  disabled: boolean;
  // A reason disables the card; the field cannot become that kind in place.
  getDisabledReason: (kind: WorldFieldKind) => string | undefined;
  onChange: (kind: WorldFieldKind) => void;
  onCreateNew?: (kind: WorldFieldKind) => void;
}) {
  return (
    <RadioCardGroup
      label={label}
      options={WORLD_FIELD_KINDS}
      value={value}
      disabled={disabled}
      isOptionDisabled={(kind) => !!getDisabledReason(kind)}
      onChange={onChange}
      sx={{
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
      }}
      renderCard={(kind, control) => (
        <WorldFieldTypeCard
          {...control}
          kind={kind}
          disabledReason={getDisabledReason(kind)}
          onCreateNew={
            onCreateNew && !disabled ? () => onCreateNew(kind) : undefined
          }
        />
      )}
    />
  );
}
