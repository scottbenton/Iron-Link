import { Box, SxProps, Theme, Typography } from "@mui/material";

export interface EmptyStateProps {
  title?: string;
  // The title looks like a heading but is a status line unless it is the
  // page's own heading (a 404 page's h1).
  titleComponent?: React.ElementType;
  message: string | React.ReactNode;
  action?: React.ReactNode;
  sx?: SxProps<Theme>;
}

export function EmptyState(props: EmptyStateProps) {
  const { title, titleComponent = "p", message, action, sx } = props;

  return (
    <Box
      display={"flex"}
      alignItems={"center"}
      flexDirection={"column"}
      sx={sx}
    >
      {title && (
        <Typography
          color={"textPrimary"}
          textAlign={"center"}
          variant="h6"
          component={titleComponent}
        >
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
