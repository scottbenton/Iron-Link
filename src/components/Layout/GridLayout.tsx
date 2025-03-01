import { Box, BoxProps } from "@chakra-ui/react";

import { ProgressBar } from "../common/ProgressBar";
import { EmptyState } from "./EmptyState";

export interface GridLayoutProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  error?: string;
  emptyStateAction?: React.ReactNode;
  emptyStateMessage?: string;
  minWidth: number;
  gap?: number;
}

export function GridLayout<T>(props: GridLayoutProps<T> & BoxProps) {
  const {
    gap = 2,
    items,
    renderItem,
    loading,
    error,
    emptyStateAction,
    emptyStateMessage,
    minWidth,
    ...boxProps
  } = props;

  if (loading) {
    return <ProgressBar />;
  }

  if (error) {
    return <EmptyState message={error} mt={4} />;
  }

  if (items.length === 0) {
    if (!emptyStateMessage) {
      return null;
    }
    return (
      <EmptyState
        message={emptyStateMessage}
        action={emptyStateAction}
        mt={4}
      />
    );
  }

  return (
    <Box containerType="inline-size">
      <Box
        display="grid"
        gridTemplateColumns={`repeat(auto-fill, minmax(${minWidth}px, 1fr))`}
        gap={gap}
        css={{
          [`@container (max-width: ${minWidth}px)`]: {
            gridTemplateColumns: "1fr",
          },
        }}
        {...boxProps}
      >
        {items.map((item, index) => (
          <Box
            key={index}
            height={"100%"}
            css={{
              "&>": {
                height: "100%",
              },
            }}
          >
            {renderItem(item, index)}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
