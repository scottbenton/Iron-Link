import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";

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
  // Offers only the read choice. The edit permission still follows read
  // changes, so it never reaches past them.
  hideEditOptions?: boolean;
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
    hideEditOptions,
    readHelperText,
    editHelperText,
    isEditPermissionAllowed = isEditPermissionWithinReadPermission,
  } = props;
  const { t } = useTranslation();
  const readLabelId = useId();
  const editLabelId = useId();

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
    <>
      <Box>
        <FormControl>
          <FormLabel id={readLabelId}>
            {t("permissions.view", "Who can view?")}
          </FormLabel>
          {readHelperText && (
            <Typography variant={"body2"} color="text.secondary" mb={1}>
              {readHelperText}
            </Typography>
          )}
          <RadioGroup
            aria-labelledby={readLabelId}
            value={readPermissions ?? null}
            onChange={(_, value) => handleReadChange(value as ReadPermissions)}
          >
            {readOptions.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Box>
      {!hideEditOptions && (
        <Box mt={3}>
          <FormControl>
            <FormLabel id={editLabelId}>
              {t("permissions.edit", "Who can edit?")}
            </FormLabel>
            {editHelperText && (
              <Typography variant={"body2"} color="text.secondary" mb={1}>
                {editHelperText}
              </Typography>
            )}
            <RadioGroup
              aria-labelledby={editLabelId}
              value={editPermissions ?? null}
              onChange={(_, value) =>
                onChange({
                  readPermissions,
                  editPermissions: value as EditPermissions,
                })
              }
            >
              {editOptions.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                  disabled={
                    !!readPermissions &&
                    !isEditPermissionAllowed(readPermissions, option.value)
                  }
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
      )}
    </>
  );
}
