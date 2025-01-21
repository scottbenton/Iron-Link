import { Box, SxProps, Theme, Typography } from "@mui/material";

export interface EmptyStateProps {
  title?: string;
  message: string | React.ReactNode;
  action?: React.ReactNode;
  sx?: SxProps<Theme>;
}

export function EmptyState(props: EmptyStateProps) {
  const { title, message, action, sx } = props;

  return (
    <Box
      display={"flex"}
      alignItems={"center"}
      flexDirection={"column"}
      sx={sx}
    >
      {title && (
        <Typography color={"textPrimary"} textAlign={"center"} variant="h6">
          {title}
        </Typography>
      )}
      {typeof message === "string" ? (
        <Typography
          color={"textSecondary"}
          textAlign={"center"}
          variant="body1"
        >
          {message}
        </Typography>
      ) : (
        message
      )}
      {action && <Box mt={2}>{action}</Box>}
    </Box>
  );
}
