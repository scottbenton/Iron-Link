import { Box, Button, Typography } from "@mui/material";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { RadioCard, type RadioCardControlProps } from "components/RadioCard";

import type { WorldFieldKind } from "lib/worldFieldRules";

import { WorldFieldKindPreview } from "./WorldFieldKindPreview";
import { getFieldKindHint, getFieldKindLabel } from "./categoryEditor.utils";

// One field kind: its name, hint and a live preview. A card that would lose
// stored values explains why and can offer to create a new field of that kind
// instead.
export function WorldFieldTypeCard({
  kind,
  disabledReason,
  onCreateNew,
  ...control
}: RadioCardControlProps & {
  kind: WorldFieldKind;
  disabledReason?: string;
  onCreateNew?: () => void;
}) {
  const { t } = useTranslation();
  const reasonId = useId();
  const createLabelId = useId();
  return (
    <RadioCard
      {...control}
      title={<span id={createLabelId}>{getFieldKindLabel(t, kind)}</span>}
      description={getFieldKindHint(t, kind)}
      describedBy={disabledReason ? [reasonId] : []}
      footer={
        disabledReason && (
          <Box
            sx={{
              px: 2,
              py: 1,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Typography
              id={reasonId}
              variant="body2"
              color="text.secondary"
              sx={{ flexGrow: 1 }}
            >
              {disabledReason}
            </Typography>
            {onCreateNew && !control.selected && (
              <Button
                size="small"
                aria-describedby={createLabelId}
                onClick={onCreateNew}
              >
                {t("worlds.fields.create-new", "Create new field")}
              </Button>
            )}
          </Box>
        )
      }
    >
      <WorldFieldKindPreview kind={kind} />
    </RadioCard>
  );
}
