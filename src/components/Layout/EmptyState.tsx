import { Box, BoxProps, Heading, Text } from "@chakra-ui/react";

export interface EmptyStateProps {
  title?: string;
  message: string | React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState(props: EmptyStateProps & BoxProps) {
  const { title, message, action, ...boxProps } = props;

  return (
    <Box
      display={"flex"}
      alignItems={"center"}
      flexDirection={"column"}
      {...boxProps}
    >
      {title && (
        <Heading color={"textPrimary"} textAlign={"center"} as="h2" size="lg">
          {title}
        </Heading>
      )}
      {typeof message === "string" ? (
        <Text color="fg.subtle">{message}</Text>
      ) : (
        message
      )}
      {action && <Box mt={2}>{action}</Box>}
    </Box>
  );
}
