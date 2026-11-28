import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Radio, RadioGroup } from "ui/components/RadioGroup";
import { Stack } from "ui/primitives";

import { EditPermissions, ReadPermissions } from "repositories/shared.types";

import {
  type EditPermissionRule,
  type PermissionOption,
  getCompatibleEditPermission,
  isEditPermissionWithinReadPermission,
} from "./permissionCompatibility";

export interface PermissionsSelectorProps {
  readOptions: PermissionOption<ReadPermissions>[];
  editOptions: PermissionOption<EditPermissions>[];
  readPermissions?: ReadPermissions;
  editPermissions?: EditPermissions;
  // Receives both permissions after every change, since a read change can
  // narrow the edit permission too.
  onChange: (permissions: {
    readPermissions?: ReadPermissions;
    editPermissions?: EditPermissions;
  }) => void;
  readHelperText?: ReactNode;
  editHelperText?: ReactNode;
  // Which edit permissions fit each read permission. By default, edit access
  // never reaches anyone who cannot read.
  isEditPermissionAllowed?: EditPermissionRule;
}

// Who can view and who can edit, where edit options that do not fit the
// chosen read permission are disabled and a read change narrows edit to fit.
export function PermissionsSelector(props: PermissionsSelectorProps) {
  const {
    readOptions,
    editOptions,
    readPermissions,
    editPermissions,
    onChange,
    readHelperText,
    editHelperText,
    isEditPermissionAllowed = isEditPermissionWithinReadPermission,
  } = props;
  const { t } = useTranslation();

  const handleReadChange = (read: ReadPermissions) => {
    onChange({
      readPermissions: read,
      editPermissions:
        editPermissions &&
        getCompatibleEditPermission(
          read,
          editPermissions,
          editOptions,
          isEditPermissionAllowed,
        ),
    });
  };

  return (
    <Stack gap="6">
      <RadioGroup<ReadPermissions>
        label={t("permissions.view", "Who can view?")}
        description={readHelperText}
        value={readPermissions}
        onValueChange={handleReadChange}
      >
        {readOptions.map((option) => (
          <Radio key={option.value} value={option.value} label={option.label} />
        ))}
      </RadioGroup>
      <RadioGroup<EditPermissions>
        label={t("permissions.edit", "Who can edit?")}
        description={editHelperText}
        value={editPermissions}
        onValueChange={(value) =>
          onChange({ readPermissions, editPermissions: value })
        }
      >
        {editOptions.map((option) => (
          <Radio
            key={option.value}
            value={option.value}
            label={option.label}
            disabled={
              !!readPermissions &&
              !isEditPermissionAllowed(readPermissions, option.value)
            }
          />
        ))}
      </RadioGroup>
    </Stack>
  );
}
