import { RadioCardGroup } from "components/RadioCard";

import { WORLD_FIELD_KINDS, type WorldFieldKind } from "lib/worldFieldRules";

import { WorldFieldTypeCard } from "./WorldFieldTypeCard";

// The field kinds as a radio group: a grid on wide screens and one column on
// phones. An existing Long text field also lists its own kind.
export function WorldFieldTypePicker({
  value,
  current,
  label,
  disabled,
  getDisabledReason,
  onChange,
  onCreateNew,
}: {
  value: WorldFieldKind;
  // The saved field's kind, if any.
  current?: WorldFieldKind;
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
      options={
        current === "longText"
          ? [WORLD_FIELD_KINDS[0], current, ...WORLD_FIELD_KINDS.slice(1)]
          : WORLD_FIELD_KINDS
      }
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
