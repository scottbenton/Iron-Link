import { Box, Typography } from "@mui/material";
import { PropsWithChildren, useId } from "react";

// A field label above content that is not a form input: a value shown
// read-only, or a rich text editor. The content is grouped under the label,
// and help text describes it.
export function WorldEntryLabelledField({
  label,
  helpText,
  children,
}: PropsWithChildren<{ label: string; helpText?: string }>) {
  const labelId = useId();
  const helpId = useId();
  return (
    <Box
      role="group"
      aria-labelledby={labelId}
      aria-describedby={helpText ? helpId : undefined}
    >
      <Typography
        id={labelId}
        variant="body2"
        component="div"
        color="text.secondary"
        sx={{ mb: 0.5 }}
      >
        {label}
      </Typography>
      {children}
      {helpText && (
        <Typography
          id={helpId}
          variant="caption"
          component="div"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          {helpText}
        </Typography>
      )}
    </Box>
  );
}
